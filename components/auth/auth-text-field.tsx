import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type AuthTextFieldProps = TextInputProps & {
  label: string;
};

export function AuthTextField({ label, style, ...props }: AuthTextFieldProps) {
  const color = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');
  const backgroundColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={muted}
        style={[styles.input, { color, backgroundColor, borderColor }, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
