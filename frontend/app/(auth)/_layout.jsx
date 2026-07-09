import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { 
          backgroundColor: '#F2F0EB' 
        },
      }}
    >
      <Stack.Screen name="Welcome" />
      <Stack.Screen name="SelectRole" />
      <Stack.Screen name="ViewerLogin" />
      <Stack.Screen name="ViewerSignup" />
      <Stack.Screen name="OwnerLogin" />
      <Stack.Screen name="OwnerSignup" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="VerifyEmail" />
    </Stack>
  );
}