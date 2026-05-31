// ScreenContainer — consistent screen frame: brand background + spacing rhythm,
// optional scroll. Every screen wraps its content in this so padding and the
// paper background are identical app-wide.
import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, RefreshControlProps } from 'react-native';
import { colors, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function ScreenContainer({ children, scroll = false, padded = true, contentStyle, refreshControl }: Props) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[padded && styles.padded, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.root, padded && styles.padded, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  padded: { padding: spacing.lg, gap: spacing.lg },
});

export default ScreenContainer;
