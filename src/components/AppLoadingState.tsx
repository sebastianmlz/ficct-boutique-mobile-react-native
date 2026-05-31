// AppLoadingState — centered spinner + optional label. One loading look app-wide.
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/theme';

interface Props {
  label?: string;
}

export function AppLoadingState({ label }: Props) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.accent} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  label: { color: colors.mute, fontSize: fontSize.sm },
});

export default AppLoadingState;
