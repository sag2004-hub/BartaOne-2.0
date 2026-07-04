import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const isSigningUp = useRef(false); // ← blocks auth listener during signup

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        if (role) setUserRole(role);
      } catch (err) {
        console.error('Error loading user role:', err);
      }
    };

    loadUserRole();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip listener entirely while signup flow is in progress.
      // ViewerSignup (and any other signup screen) sets this flag before
      // calling createUserWithEmailAndPassword and clears it after the
      // backend /register call completes, ensuring the user exists in
      // MongoDB before any profile fetch is attempted.
      if (isSigningUp.current) {
        console.log('⏭️ [AuthContext] Skipping auth state change — signup in progress');
        setIsLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setError(null);

        try {
          // Get fresh Firebase ID token and store it — this is what api.js sends
          // as the Bearer token. Firebase auto-refreshes it when it nears expiry,
          // and onAuthStateChanged fires again so we re-save it here.
          const idToken = await firebaseUser.getIdToken();
          await AsyncStorage.setItem('authToken', idToken);

          // Get role from custom claims, falling back to stored value or default
          const tokenResult = await firebaseUser.getIdTokenResult();
          const role =
            tokenResult.claims?.role ||
            (await AsyncStorage.getItem('userRole')) ||
            'viewer';

          setUserRole(role);
          await AsyncStorage.setItem('userRole', role);
        } catch (err) {
          console.error('Error saving auth token or role:', err);
        }
      } else {
        setUser(null);
        setUserRole(null);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userRole');
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Save ID token immediately so any call made right after login has it
      const idToken = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', idToken);

      setUser(userCredential.user);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
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

      await updateProfile(userCredential.user, { displayName });

      // Save ID token right away
      const idToken = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', idToken);

      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);

      await sendEmailVerification(userCredential.user);

      setUser(userCredential.user);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      const idToken = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('authToken', idToken);

      setUser(userCredential.user);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout — clear both token and role
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
    } catch (err) {
      setError(err.message);
      throw err;
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
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Firebase profile fields (displayName, photoURL)
  const updateUserProfile = async (updates) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!auth.currentUser) throw new Error('No user logged in');
      await updateProfile(auth.currentUser, updates);
      setUser(auth.currentUser);
      return auth.currentUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Set role manually (e.g. after role-selection screen)
  const setRole = async (role) => {
    try {
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
    } catch (err) {
      console.error('Error setting user role:', err);
    }
  };

  // Call setSigningUp(true) before createUserWithEmailAndPassword in any
  // signup screen, and setSigningUp(false) after the backend /register
  // call succeeds (or in the catch block). This prevents onAuthStateChanged
  // from firing a profile fetch before the user exists in MongoDB.
  const setSigningUp = (val) => {
    isSigningUp.current = val;
  };

  const isAuthenticated = () => !!user;
  const isOwner = () => userRole === 'owner';
  const isViewer = () => userRole === 'viewer';

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
    setSigningUp,
    isAuthenticated,
    isOwner,
    isViewer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;