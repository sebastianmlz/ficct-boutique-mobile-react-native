// AppButton — the single button primitive. Variants encode the same hierarchy
// as the admin (.btn-primary / .btn-secondary / .btn-danger) plus a ghost.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { AppIcon, IconName } from './AppIcon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.ink,
  danger: colors.white,
  ghost: colors.accent,
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={FG[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} size={size === 'sm' ? 16 : 18} color={FG[variant]} /> : null}
          <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: FG[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  md: { paddingHorizontal: spacing.lg, paddingVertical: 12 },
  sm: { paddingHorizontal: spacing.md, paddingVertical: 8 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  labelSm: { fontSize: fontSize.sm },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
});

export default AppButton;
