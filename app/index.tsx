import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';

export default function Index() {
  const { firebaseUser, profile, isLoading, isConfigured } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isConfigured || !firebaseUser || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profile.role !== 'student') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
