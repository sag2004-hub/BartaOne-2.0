// app/_layout.jsx
import { Stack } from 'expo-router';
import { useColorScheme, View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { UserProvider } from '../context/UserContext';

const LIGHT = { surface: '#FFFFFF', primary: '#1A2733', bg: '#F2F0EB' };
const DARK  = { surface: '#161B22', primary: '#EDF2F7', bg: '#0D1117' };

// Error Boundary component to catch and display errors gracefully
function ErrorBoundary({ children }) {
  try {
    return children;
  } catch (error) {
    console.error('Layout Error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
          Something went wrong. Please restart the app.
        </Text>
        <Text style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
          {error.message}
        </Text>
      </View>
    );
  }
}

// Loading wrapper to handle auth state
function AppContent({ children, colorScheme }) {
  const C = colorScheme === 'dark' ? DARK : LIGHT;
  
  // You can use auth here if needed
  // const { isLoading } = useAuth();
  
  return (
    <Stack
      screenOptions={{
        headerStyle:         { backgroundColor: C.surface },
        headerTitleStyle:    { color: C.primary, fontWeight: '600' },
        headerTintColor:     C.primary,
        headerShadowVisible: false,
        contentStyle:        { backgroundColor: C.bg },
      }}
    >
      {children}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK : LIGHT;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserProvider>
          <AppContent colorScheme={colorScheme}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(viewer)" options={{ headerShown: false }} />
            <Stack.Screen name="(owner)" options={{ headerShown: false }} />
          </AppContent>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}