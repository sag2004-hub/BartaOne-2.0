import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for stored user role
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        if (role) {
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);
        setError(null);
        
        // Get user role from custom claims or stored data
        try {
          const token = await firebaseUser.getIdTokenResult();
          const role = token.claims?.role || await AsyncStorage.getItem('userRole') || 'viewer';
          setUserRole(role);
          await AsyncStorage.setItem('userRole', role);
        } catch (error) {
          console.error('Error getting user role:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        setUserRole(null);
        await AsyncStorage.removeItem('userRole');
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register with email and password
  const register = async (email, password, displayName, role = 'viewer') => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      // Store user role
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      await AsyncStorage.removeItem('userRole');
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    setIsLoading(true);
    setError(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, updates);
        // Refresh user object
        const updatedUser = auth.currentUser;
        setUser(updatedUser);
        return updatedUser;
      }
      throw new Error('No user logged in');
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Set user role
  const setRole = async (role) => {
    try {
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
    } catch (error) {
      console.error('Error setting user role:', error);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is a channel owner
  const isOwner = () => {
    return userRole === 'owner';
  };

  // Check if user is a viewer
  const isViewer = () => {
    return userRole === 'viewer';
  };

  // Context value
  const value = {
    user,
    userRole,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    setRole,
    isAuthenticated,
    isOwner,
    isViewer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;