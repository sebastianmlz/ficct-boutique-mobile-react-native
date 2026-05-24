import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/services/auth/auth.context';
import { useNotifications } from '@/services/notifications/notifications.context';
import type { InboxItem, NotificationScreenView } from '@/services/notifications/notification-types';

export function NotificationsScreen() {
  const { user, logout } = useAuth();
  const { screen, unreadCount, requestPermissionAndRegister, scheduleLocalTest, markRead, markAllRead, clearInbox } =
    useNotifications();

  const onTestPress = useCallback(async () => {
    try {
      await scheduleLocalTest();
    } catch (err) {
      Alert.alert('No se pudo programar la notificación', (err as Error).message);
    }
  }, [scheduleLocalTest]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.userBlock}>
        <Text style={styles.userLabel}>Sesión activa</Text>
        <Text style={styles.userName} selectable>
          {user?.fullName}
        </Text>
        <Text style={styles.userEmail} selectable>
          {user?.email}
        </Text>
        <TouchableOpacity style={styles.logout} onPress={() => logout()}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.section}>Centro de notificaciones</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} testID="unread-badge">
              {unreadCount}
            </Text>
          </View>
        ) : null}
      </View>

      <ScreenBody view={screen} onEnable={requestPermissionAndRegister} onTestPress={onTestPress} markRead={markRead} />

      {screen.kind === 'loaded' ? (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.linkBtn} onPress={markAllRead}>
            <Text style={styles.linkBtnText}>Marcar todo leído</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={clearInbox}>
            <Text style={styles.linkBtnText}>Limpiar bandeja</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

function ScreenBody({
  view,
  onEnable,
  onTestPress,
  markRead,
}: {
  view: NotificationScreenView;
  onEnable: () => Promise<void>;
  onTestPress: () => Promise<void>;
  markRead: (id: string) => void;
}) {
  switch (view.kind) {
    case 'loading':
      return (
        <View style={styles.stateBox} testID="state-loading">
          <ActivityIndicator />
          <Text style={styles.stateText}>Configurando notificaciones…</Text>
        </View>
      );
    case 'denied':
      return (
        <View style={styles.stateBox} testID="state-denied">
          <Text style={styles.stateTitle}>Notificaciones desactivadas</Text>
          <Text style={styles.stateText}>{view.helpText}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onEnable}>
            <Text style={styles.primaryBtnText}>Reintentar permiso</Text>
          </TouchableOpacity>
        </View>
      );
    case 'unavailable':
      return (
        <View style={styles.stateBox} testID="state-unavailable">
          <Text style={styles.stateTitle}>No disponibles en este dispositivo</Text>
          <Text style={styles.stateText}>{view.reason}</Text>
        </View>
      );
    case 'error':
      return (
        <View style={styles.stateBox} testID="state-error">
          <Text style={styles.stateTitle}>Hubo un problema</Text>
          <Text style={styles.stateText} selectable>
            {view.message}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onEnable}>
            <Text style={styles.primaryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    case 'empty':
      return (
        <View style={styles.stateBox} testID="state-empty">
          <Text style={styles.stateTitle}>Sin avisos por ahora</Text>
          <Text style={styles.stateText}>
            Te avisaremos aquí cuando lleguen nuevas notificaciones de tu pedido o promociones.
          </Text>
          <Text style={styles.tokenLine} selectable>
            Token: {abbreviate(view.token)} · {view.platform}
          </Text>
          {Platform.OS !== 'web' ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onTestPress}>
              <Text style={styles.secondaryBtnText}>Enviar notificación local de prueba</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    case 'loaded':
      return (
        <View testID="state-loaded">
          <Text style={styles.tokenLine} selectable>
            Token: {abbreviate(view.token)} · {view.platform}
          </Text>
          <FlatList
            data={view.items}
            keyExtractor={(it) => it.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => <InboxRow item={item} onPress={() => markRead(item.id)} />}
          />
          {Platform.OS !== 'web' ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onTestPress}>
              <Text style={styles.secondaryBtnText}>Enviar notificación local de prueba</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
  }
}

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.item, !item.read && styles.itemUnread]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.timestamp}>{new Date(item.receivedAt).toLocaleString('es-BO')}</Text>
      </View>
      {!item.read ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );
}

function abbreviate(token: string): string {
  if (token.length <= 24) return token;
  return `${token.slice(0, 12)}…${token.slice(-8)}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  userBlock: { backgroundColor: '#1c1917', borderRadius: 12, padding: 16 },
  userLabel: { color: '#a8a29e', fontSize: 11, letterSpacing: 1 },
  userName: { color: '#fafaf9', fontSize: 18, fontWeight: '700', marginTop: 4 },
  userEmail: { color: '#a8a29e', marginTop: 2 },
  logout: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#9a3412', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#fafaf9', fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 16, fontWeight: '700' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#9a3412', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, fontVariant: ['tabular-nums'] },

  stateBox: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, padding: 16, gap: 8, alignItems: 'flex-start' },
  stateTitle: { fontWeight: '700', fontSize: 14 },
  stateText: { color: '#57534e', fontSize: 13 },
  tokenLine: { color: '#78716c', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  primaryBtn: { marginTop: 4, backgroundColor: '#1c1917', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: '#fafaf9', fontWeight: '700' },
  secondaryBtn: { marginTop: 12, backgroundColor: '#9a3412', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  secondaryBtnText: { color: '#fafaf9', fontWeight: '700' },

  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  itemUnread: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  title: { fontWeight: '700' },
  body: { color: '#44403c', marginTop: 4 },
  timestamp: { color: '#a8a29e', fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9a3412' },

  toolbar: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end' },
  linkBtn: { paddingVertical: 6 },
  linkBtnText: { color: '#1c1917', fontWeight: '600' },
});
