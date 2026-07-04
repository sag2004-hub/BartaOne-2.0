import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create User Context
const UserContext = createContext();

// User Provider Component
export function UserProvider({ children }) {
  const { user, setSigningUp } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    location: {
      state: '',
      district: '',
      city: '',
      area: '',
    },
    notifications: true,
  });

  // When this is true, the next user change (from signup) will be ignored.
  // ViewerSignup calls setSigningUp(true) before createUserWithEmailAndPassword
  // and setSigningUp(false) after /register succeeds, but UserContext needs its
  // own guard because it reacts to `user` independently of AuthContext's listener.
  const skipProfileLoad = useRef(false);

  // Expose a way for signup screens to suppress the profile load.
  // Usage in ViewerSignup:
  //   const { suppressNextProfileLoad } = useUser();  ← optional helper
  // OR simply rely on setSigningUp from AuthContext (see below).
  const suppressNextProfileLoad = () => {
    skipProfileLoad.current = true;
  };

  const resumeProfileLoad = () => {
    skipProfileLoad.current = false;
  };

  // Load user profile when auth user changes
  useEffect(() => {
    if (user) {
      if (skipProfileLoad.current) {
        // Signup is in progress — user exists in Firebase but not yet in MongoDB.
        // Do nothing; ViewerSignup will call loadUserProfile() manually after
        // /register succeeds, or navigation to ViewerHome will trigger a fresh load.
        console.log('⏭️ [UserContext] Skipping profile load — signup in progress');
        return;
      }
      loadUserProfile();
      loadPreferences();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Load user profile from API
  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userAPI.getProfile();
      const profile = response.data;
      setUserProfile(profile);
      // Update preferences with user's location and language
      if (profile) {
        setPreferences(prev => ({
          ...prev,
          language: profile.preferredLanguage || 'en',
          location: profile.location || {
            state: '',
            district: '',
            city: '',
            area: '',
          },
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user preferences from storage
  const loadPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem('userPreferences');
      if (prefs) {
        const parsedPrefs = JSON.parse(prefs);
        setPreferences(prev => ({
          ...prev,
          ...parsedPrefs,
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userAPI.updateProfile(updates);
      const updated = response.data;
      setUserProfile(updated);
      return updated;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (newPrefs) => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));

      // If language changed, update user profile
      if (newPrefs.language && newPrefs.language !== preferences.language) {
        await updateProfile({ preferredLanguage: newPrefs.language });
      }

      // If location changed, update user profile
      if (newPrefs.location) {
        await updateProfile({ location: newPrefs.location });
      }

      return updatedPrefs;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  // Update user location
  const updateLocation = async (location) => {
    return updatePreferences({ location });
  };

  // Update user language
  const updateLanguage = async (language) => {
    return updatePreferences({ language });
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    return updatePreferences({ notifications: !preferences.notifications });
  };

  // Clear user data (logout)
  const clearUserData = async () => {
    setUserProfile(null);
    setPreferences({
      language: 'en',
      theme: 'light',
      location: {
        state: '',
        district: '',
        city: '',
        area: '',
      },
      notifications: true,
    });
    await AsyncStorage.removeItem('userPreferences');
  };

  // Context value
  const value = {
    userProfile,
    preferences,
    isLoading,
    error,
    loadUserProfile,
    updateProfile,
    updatePreferences,
    updateLocation,
    updateLanguage,
    toggleNotifications,
    clearUserData,
    suppressNextProfileLoad, // ← call this before signup starts
    resumeProfileLoad,       // ← call this after /register succeeds
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;