import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/services/auth/auth.context';

export function NotificationsScreen() {
  const { user, logout } = useAuth();

  // Notification feed placeholder — when the Go core exposes a notification
  // subscription, this screen will be replaced by a real WebSocket feed
  // sourced from `notification.fanout` after a confirmed sale.
  const items = [
    {
      id: '1',
      title: 'Bienvenido a FICCT Boutique',
      body: 'Explore el catálogo o use la búsqueda visual para encontrar prendas similares.',
      kind: 'info',
    },
    {
      id: '2',
      title: 'Nuevos artículos en otoño',
      body: 'La colección Otoño 2026 ya está disponible en sus sucursales.',
      kind: 'promo',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.userBlock}>
        <Text style={styles.userLabel}>Sesión activa</Text>
        <Text style={styles.userName}>{user?.fullName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <TouchableOpacity style={styles.logout} onPress={() => logout()}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Avisos</Text>
      {items.map((n) => (
        <View key={n.id} style={[styles.item, n.kind === 'promo' && styles.itemPromo]}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
        </View>
      ))}

      <Text style={styles.placeholder}>
        Las notificaciones push aparecerán aquí. La integración con Expo Push está pendiente
        de configuración del proyecto Expo en producción.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  userBlock: { backgroundColor: '#1c1917', borderRadius: 12, padding: 16 },
  userLabel: { color: '#a8a29e', fontSize: 11, letterSpacing: 1 },
  userName: { color: '#fafaf9', fontSize: 18, fontWeight: '700', marginTop: 4 },
  userEmail: { color: '#a8a29e', marginTop: 2 },
  logout: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#9a3412', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fafaf9', fontWeight: '700' },
  section: { fontSize: 14, fontWeight: '700' },
  item: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12 },
  itemPromo: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  title: { fontWeight: '700' },
  body: { color: '#44403c', marginTop: 4 },
  placeholder: { color: '#78716c', fontSize: 12, textAlign: 'center' },
});
