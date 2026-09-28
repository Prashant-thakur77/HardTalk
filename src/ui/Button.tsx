import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, MIN_TARGET, radius, space } from './theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  hint?: string;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', hint, disabled = false }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: primary ? colors.onPrimary : colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TARGET,
    borderRadius: radius,
    paddingHorizontal: space.lg,
    paddingVertical: space.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 17, fontWeight: '600' },
});
