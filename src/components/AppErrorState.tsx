// AppErrorState — friendly, customer-safe error surface with an icon and an
// optional retry. Callers pass a human message; raw technical errors must be
// mapped to friendly copy before reaching this component.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';
import { AppIcon } from './AppIcon';
import { AppButton } from './AppButton';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function AppErrorState({
  title = 'Algo salió mal',
  message = 'No pudimos cargar esta sección. Inténtalo de nuevo.',
  onRetry,
  retryLabel = 'Reintentar',
}: Props) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <AppIcon name="alert" size={26} color={colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label={retryLabel} icon="refresh" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  iconWrap: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.ink },
  message: { fontSize: fontSize.sm, color: colors.mute, textAlign: 'center', maxWidth: 280 },
});

export default AppErrorState;
