import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Theme Context
const ThemeContext = createContext();

// Theme colors
export const lightTheme = {
  // Colors
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  
  background: '#F8F9FA',
  card: '#FFFFFF',
  cardShadow: 'rgba(0,0,0,0.05)',
  
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#888888',
  textLighter: '#CCCCCC',
  
  border: '#F0F0F0',
  divider: '#E0E0E0',
  
  success: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  
  // Status bar
  statusBar: 'dark-content',
};

export const darkTheme = {
  // Colors
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  
  background: '#1A1A2E',
  card: '#16213E',
  cardShadow: 'rgba(0,0,0,0.3)',
  
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textLight: '#999999',
  textLighter: '#666666',
  
  border: '#2D2D44',
  divider: '#2D2D44',
  
  success: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  
  // Status bar
  statusBar: 'light-content',
};

// Theme Provider Component
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  // Load theme from storage
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('userTheme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Use system theme if no saved theme
        setTheme(systemColorScheme || 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme to storage
  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('userTheme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Toggle theme between light and dark
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await saveTheme(newTheme);
  };

  // Set theme to light
  const setLightTheme = async () => {
    await saveTheme('light');
  };

  // Set theme to dark
  const setDarkTheme = async () => {
    await saveTheme('dark');
  };

  // Use system theme
  const useSystemTheme = async () => {
    await saveTheme(systemColorScheme || 'light');
  };

  // Get current theme colors
  const getThemeColors = () => {
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  // Context value
  const value = {
    theme,
    isLoading,
    colors: getThemeColors(),
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    useSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// HOC to wrap components with theme styles
export function withTheme(Component) {
  return function WrappedComponent(props) {
    const { colors } = useTheme();
    return <Component {...props} theme={colors} />;
  };
}

export default ThemeContext;