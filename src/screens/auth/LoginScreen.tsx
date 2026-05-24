import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '@/services/auth/auth.context';

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
        <Text style={styles.brand}>FICCT</Text>
        <Text style={styles.title}>Boutique</Text>
        <Text style={styles.subtitle}>App para clientes</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {loginError ? <Text style={styles.error}>{loginError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fafaf9" /> : <Text style={styles.buttonText}>Ingresar</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Sistema integrado FICCT • v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  brand: { fontSize: 12, letterSpacing: 4, color: '#78716c' },
  title: { fontSize: 40, color: '#1c1917', marginTop: 4 },
  subtitle: { color: '#78716c', marginTop: 4 },
  form: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, padding: 20 },
  label: { fontSize: 13, color: '#1c1917', marginBottom: 4, marginTop: 8 },
  input: { borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafaf9' },
  error: { color: '#b91c1c', marginTop: 12, fontSize: 13 },
  button: { backgroundColor: '#1c1917', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fafaf9', fontWeight: '600' },
  footer: { textAlign: 'center', color: '#78716c', fontSize: 11, marginTop: 24 },
});
