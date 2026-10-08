import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { getAuthErrorMessage } from '@/lib/firebase-errors';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const { signIn, isConfigured, missingEnvVars } = useAuth();
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConfigured) {
    return (
      <AuthScreenLayout
        title="Firebase setup needed"
        subtitle="Add your Firebase web config to .env, then restart Expo.">
        <ThemedText style={{ color: danger }}>{missingEnvVars.join('\n')}</ThemedText>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in with your Cohort Live account.">
      <AuthTextField
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <AuthTextField
        label="Password"
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <ThemedText style={{ color: danger }}>{error}</ThemedText> : null}
      <PrimaryButton label="Log in" loading={submitting} onPress={handleLogin} />
      <Link href="/register" style={styles.link}>
        <ThemedText style={[styles.linkText, { color: tint }]}>
          New here? Create an account
        </ThemedText>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
