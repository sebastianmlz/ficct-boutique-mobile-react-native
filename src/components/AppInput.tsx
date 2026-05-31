// AppInput — labelled text field matching the admin `.input` / `.label`.
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
}

export function AppInput({ label, hint, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mute}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.ink },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.ink },
  hint: { fontSize: fontSize.xs, color: colors.mute },
});

export default AppInput;
