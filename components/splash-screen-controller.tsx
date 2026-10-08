import { SplashScreen } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useAuth();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
