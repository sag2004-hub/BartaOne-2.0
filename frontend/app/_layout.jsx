import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

const LIGHT = { surface: '#FFFFFF', primary: '#1A2733', bg: '#F2F0EB' };
const DARK  = { surface: '#161B22', primary: '#EDF2F7', bg: '#0D1117' };

export default function RootLayout() {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle:         { backgroundColor: C.surface },
          headerTitleStyle:    { color: C.primary, fontWeight: '600' },
          headerTintColor:     C.primary,
          headerShadowVisible: false,
          contentStyle:        { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="(auth)"   options={{ headerShown: false }} />
        <Stack.Screen name="(viewer)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)"  options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}