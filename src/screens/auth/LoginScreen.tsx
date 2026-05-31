import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/services/auth/auth.context';
import { AppButton, AppCard, AppInput } from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

export function LoginScreen() {
  const { login, loginError } = useAuth();
  const [email, setEmail] = useState('cliente@ficct.local');
  const [password, setPassword] = useState('Cliente123!');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (): Promise<void> => {
    setBusy(true);
    await login(email, password);
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>F I C C T</Text>
        <Text style={styles.title}>Boutique</Text>
        <Text style={styles.subtitle}>App para clientes</Text>
      </View>

      <AppCard style={styles.form}>
        <AppInput
          label="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="tucorreo@ficct.local"
        />
        <AppInput label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
        {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
        <AppButton label="Ingresar" icon="chevronRight" onPress={onSubmit} loading={busy} fullWidth style={styles.submit} />
      </AppCard>

      <Text style={styles.footer}>Sistema integrado FICCT • v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  brand: { fontSize: fontSize.xs, letterSpacing: 6, color: colors.mute, fontWeight: '600' },
  title: { fontFamily: fonts.display, fontSize: 40, color: colors.ink, marginTop: 6, letterSpacing: -0.5 },
  subtitle: { color: colors.mute, marginTop: 4, fontSize: fontSize.sm },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontSize: fontSize.sm },
  submit: { marginTop: spacing.xs },
  footer: { textAlign: 'center', color: colors.mute, fontSize: fontSize.xs, marginTop: spacing.xl },
});
