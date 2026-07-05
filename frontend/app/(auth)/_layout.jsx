import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

const LIGHT = { surface: '#FFFFFF', primary: '#1A2733', bg: '#F2F0EB' };
const DARK  = { surface: '#161B22', primary: '#EDF2F7', bg: '#0D1117' };

export default function AuthLayout() {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;

  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: C.surface },
        headerTitleStyle: { color: C.primary, fontWeight: '600' },
        headerTintColor:  C.primary,
        headerShadowVisible: false,
        contentStyle:     { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="Welcome"        options={{ headerShown: false }} />
      <Stack.Screen name="SelectRole"     options={{ title: 'Select Role' }} />
      <Stack.Screen name="ViewerLogin"    options={{ title: 'Viewer Login' }} />
      <Stack.Screen name="ViewerSignup"   options={{ title: 'Create Account' }} />
      <Stack.Screen name="OwnerLogin"     options={{ title: 'Owner Login' }} />
      <Stack.Screen name="OwnerSignup"    options={{ title: 'Create Owner Account' }} />
      <Stack.Screen name="ForgotPassword" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="VerifyEmail"    options={{ title: 'Verify Email' }} />
    </Stack>
  );
}