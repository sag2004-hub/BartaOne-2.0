// context/UserContext.js
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { userAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [authError, setAuthError] = useState(null);
  let auth;
  
  try {
    auth = useAuth();
  } catch (error) {
    console.error('UserProvider: Failed to useAuth:', error);
    setAuthError(error);
  }

  // If auth failed, show error but still render children
  if (authError) {
    console.warn('⚠️ AuthProvider not available, UserProvider will work in limited mode');
    // Return children without user context functionality
    return (
      <UserContext.Provider value={{
        userProfile: null,
        preferences: {
          language: 'en',
          theme: 'light',
          location: { state: '', district: '', city: '', area: '' },
          notifications: true,
        },
        isLoading: false,
        error: authError.message,
        loadUserProfile: async () => {},
        updateProfile: async () => {},
        updatePreferences: async () => {},
        updateLocation: async () => {},
        updateLanguage: async () => {},
        toggleNotifications: async () => {},
        clearUserData: async () => {},
        suppressNextProfileLoad: () => {},
        resumeProfileLoad: () => {},
      }}>
        {children}
      </UserContext.Provider>
    );
  }

  // If auth is available, proceed normally
  if (!auth) {
    // Auth is still loading - this is properly wrapped
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C8001A" />
        <Text style={{ marginTop: 10, color: '#8A97A5' }}>Loading...</Text>
      </View>
    );
  }

  const { user, setSigningUp } = auth;
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

  const skipProfileLoad = useRef(false);

  const suppressNextProfileLoad = () => {
    skipProfileLoad.current = true;
  };

  const resumeProfileLoad = () => {
    skipProfileLoad.current = false;
  };

  useEffect(() => {
    if (user) {
      if (skipProfileLoad.current) {
        console.log('⏭️ [UserContext] Skipping profile load — signup in progress');
        return;
      }
      loadUserProfile();
      loadPreferences();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userAPI.getProfile();
      const profile = response.data;
      setUserProfile(profile);
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

  const updatePreferences = async (newPrefs) => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));

      if (newPrefs.language && newPrefs.language !== preferences.language) {
        await updateProfile({ preferredLanguage: newPrefs.language });
      }

      if (newPrefs.location) {
        await updateProfile({ location: newPrefs.location });
      }

      return updatedPrefs;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const updateLocation = async (location) => {
    return updatePreferences({ location });
  };

  const updateLanguage = async (language) => {
    return updatePreferences({ language });
  };

  const toggleNotifications = async () => {
    return updatePreferences({ notifications: !preferences.notifications });
  };

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
    suppressNextProfileLoad,
    resumeProfileLoad,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;