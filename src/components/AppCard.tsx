// AppCard — surface container matching the admin `.card` (white surface,
// hairline border, lg radius, soft shadow).
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

export function AppCard({ children, onPress, padded = true, style }: Props) {
  const content = [styles.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...content, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...(shadow.card as object),
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.9 },
});

export default AppCard;
