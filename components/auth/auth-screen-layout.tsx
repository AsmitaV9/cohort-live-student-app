import { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View
              style={styles.brand}
              accessible
              accessibilityRole="image"
              accessibilityLabel="CohortLive. Learn live. Test real.">
              <Image
                source={
                  scheme === 'dark'
                    ? require('@/assets/images/brand/logo-tagline-stacked-dark.png')
                    : require('@/assets/images/brand/logo-tagline-stacked-light.png')
                }
                style={styles.logo}
              />
            </View>
            <ThemedText type="title">{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            <View style={styles.form}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  // Stacked logo + tagline from the brand kit (157 × 140 at 1x).
  logo: {
    width: 135,
    height: 120,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    opacity: 0.75,
  },
  form: {
    gap: 16,
  },
});
