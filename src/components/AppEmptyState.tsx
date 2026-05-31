// AppEmptyState — calm, branded empty surface with an icon, title and subtitle,
// plus an optional action. Used for empty lists, carts, inboxes, results.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { AppIcon, IconName } from './AppIcon';
import { AppButton } from './AppButton';

interface Props {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AppEmptyState({ icon = 'inbox', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={24} color={colors.mute} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  iconWrap: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, color: colors.mute, textAlign: 'center', maxWidth: 300 },
});

export default AppEmptyState;
