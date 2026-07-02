import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to get current user with real-time updates
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const { user } = useAuth();
  return !!user;
}

// Hook to get user role
export function useUserRole() {
  const { userRole, isOwner, isViewer } = useAuth();
  return { userRole, isOwner, isViewer };
}

// Hook for login functionality
export function useLogin() {
  const { login, loginWithGoogle, isLoading, error } = useAuth();
  return { login, loginWithGoogle, isLoading, error };
}

// Hook for registration functionality
export function useRegister() {
  const { register, isLoading, error } = useAuth();
  return { register, isLoading, error };
}

// Hook for logout functionality
export function useLogout() {
  const { logout, isLoading, error } = useAuth();
  return { logout, isLoading, error };
}

export default useAuth;