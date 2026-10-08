import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  const tint = useThemeColor({}, 'tint');

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
            <View style={styles.brand}>
              <View style={[styles.mark, { backgroundColor: tint }]} />
              <ThemedText type="subtitle">Cohort Live</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  mark: {
    width: 12,
    height: 12,
    borderRadius: 4,
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
