import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerGlobals } from '@livekit/react-native';
import 'react-native-reanimated';

import { SplashScreenController } from '@/components/splash-screen-controller';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

registerGlobals();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
        <SplashScreenController />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { firebaseUser, profile, isLoading, isConfigured } = useAuth();
  const isAuthenticated = !!firebaseUser && profile?.role === 'student';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isConfigured && !isLoading && isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated || !isConfigured || isLoading}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}