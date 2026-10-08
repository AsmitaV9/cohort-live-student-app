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

export default function RegisterScreen() {
  const { register, isConfigured, missingEnvVars } = useAuth();
  const danger = useThemeColor({}, 'danger');
  const tint = useThemeColor({}, 'tint');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Enter your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await register({
        name,
        email,
        password,
      });
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
      title="Create account"
      subtitle="Create your student account to join Cohort Live classes.">
      <AuthTextField
        label="Name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        value={name}
        onChangeText={setName}
      />
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
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <ThemedText style={{ color: danger }}>{error}</ThemedText> : null}
      <PrimaryButton label="Create account" loading={submitting} onPress={handleRegister} />
      <Link href="/login" style={styles.link}>
        <ThemedText style={[styles.linkText, { color: tint }]}>
          Already have an account? Log in
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
