// AppBadge — status pill. Tones mirror the admin badge language
// (active / pending / deleted / neutral / accent).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius } from '@/theme';

export type BadgeTone = 'active' | 'pending' | 'deleted' | 'neutral' | 'accent';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  active: { bg: colors.successBg, fg: colors.successFg },
  pending: { bg: colors.warnBg, fg: colors.warnFg },
  deleted: { bg: colors.neutralBg, fg: colors.neutralFg },
  neutral: { bg: colors.neutralBg, fg: colors.neutralFg },
  accent: { bg: colors.accentSoft, fg: colors.accent },
};

interface Props {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

export function AppBadge({ label, tone = 'neutral', dot }: Props) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});

export default AppBadge;
