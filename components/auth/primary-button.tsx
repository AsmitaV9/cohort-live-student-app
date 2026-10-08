import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({ label, loading = false, disabled, ...props }: PrimaryButtonProps) {
  const backgroundColor = useThemeColor({}, 'tint');
  const lightText = useThemeColor({ light: '#FFFFFF', dark: '#0B1220' }, 'text');

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1 },
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={lightText} />
      ) : (
        <Text style={[styles.label, { color: lightText }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
