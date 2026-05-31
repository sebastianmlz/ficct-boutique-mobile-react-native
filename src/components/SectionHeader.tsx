// SectionHeader — editorial section title (serif display) + optional subtitle
// and a right-aligned action slot. Mirrors the admin's section headings.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  texts: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: fontSize.sm, color: colors.mute, marginTop: 2 },
});

export default SectionHeader;
