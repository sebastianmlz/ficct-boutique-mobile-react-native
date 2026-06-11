import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/services/auth/auth.context';
import { useNotifications } from '@/services/notifications/notifications.context';
import type { InboxItem, NotificationScreenView } from '@/services/notifications/notification-types';
import { AppButton, AppIcon } from '@/components';
import type { IconName } from '@/components';
import { colors, fonts, fontSize, fontWeight, radius, spacing } from '@/theme';

export function NotificationsScreen() {
  const { user, logout } = useAuth();
  const { screen, unreadCount, requestPermissionAndRegister, scheduleLocalTest, markRead, markAllRead, clearInbox } =
    useNotifications();

  const onTestPress = useCallback(async () => {
    try {
      await scheduleLocalTest();
    } catch {
      Alert.alert('No se pudo programar la notificación', 'Inténtalo de nuevo más tarde.');
    }
  }, [scheduleLocalTest]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.userBlock}>
        <View style={styles.userTop}>
          <View style={styles.userAvatar}>
            <AppIcon name="notifications" size={18} color={colors.paper} />
          </View>
          <View style={styles.userTexts}>
            <Text style={styles.userLabel}>SESIÓN ACTIVA</Text>
            <Text style={styles.userName} selectable>{user?.fullName}</Text>
            <Text style={styles.userEmail} selectable>{user?.email}</Text>
          </View>
        </View>
        <Pressable style={styles.logout} onPress={() => logout()}>
          <AppIcon name="logout" size={16} color={colors.paper} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.section}>Centro de notificaciones</Text>
        {unreadCount > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText} testID="unread-badge">{unreadCount}</Text>
          </View>
        ) : null}
      </View>

      <ScreenBody view={screen} onEnable={requestPermissionAndRegister} onTestPress={onTestPress} markRead={markRead} />

      {screen.kind === 'loaded' ? (
        <View style={styles.toolbar}>
          <Pressable style={styles.linkBtn} onPress={markAllRead}>
            <Text style={styles.linkBtnText}>Marcar todo leído</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={clearInbox}>
            <Text style={styles.linkBtnText}>Limpiar bandeja</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function StateBox({ testID, icon, tone, title, text, children }: {
  testID: string;
  icon: IconName;
  tone: 'neutral' | 'accent' | 'danger';
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  const iconColor = tone === 'danger' ? colors.danger : tone === 'accent' ? colors.accent : colors.mute;
  const bg = tone === 'danger' ? colors.dangerBg : tone === 'accent' ? colors.accentSoft : colors.surfaceAlt;
  return (
    <View style={styles.stateBox} testID={testID}>
      <View style={[styles.stateIcon, { backgroundColor: bg }]}>
        <AppIcon name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {text ? <Text style={styles.stateText}>{text}</Text> : null}
      {children}
    </View>
  );
}

function ScreenBody({ view, onEnable, onTestPress, markRead }: {
  view: NotificationScreenView;
  onEnable: () => Promise<void>;
  onTestPress: () => Promise<void>;
  markRead: (id: string) => void;
}) {
  switch (view.kind) {
    case 'loading':
      return (
        <View style={styles.stateBox} testID="state-loading">
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stateText}>Configurando notificaciones…</Text>
        </View>
      );
    case 'denied':
      return (
        <StateBox testID="state-denied" icon="bellOff" tone="accent" title="Notificaciones desactivadas" text={view.helpText}>
          <AppButton label="Reintentar permiso" icon="refresh" onPress={onEnable} style={styles.stateBtn} />
        </StateBox>
      );
    case 'unavailable':
      return <StateBox testID="state-unavailable" icon="info" tone="neutral" title="No disponibles en este dispositivo" text={view.reason} />;
    case 'error':
      return (
        <StateBox testID="state-error" icon="alert" tone="danger" title="Hubo un problema" text={view.message}>
          <AppButton label="Reintentar" icon="refresh" variant="secondary" onPress={onEnable} style={styles.stateBtn} />
        </StateBox>
      );
    case 'empty':
      return (
        <StateBox testID="state-empty" icon="notifications" tone="neutral" title="Sin avisos por ahora" text="Te avisaremos aquí cuando lleguen novedades de tu pedido o promociones.">
          {view.token ? (
            <Text style={styles.tokenLine} selectable>Dispositivo: {abbreviate(view.token)} · {view.platform}</Text>
          ) : (
            <AppButton label="Activar notificaciones" icon="notifications" onPress={onEnable} style={styles.stateBtn} />
          )}
          {Platform.OS !== 'web' ? <AppButton label="Enviar notificación de prueba" icon="notifications" variant="secondary" onPress={onTestPress} style={styles.stateBtn} /> : null}
        </StateBox>
      );
    case 'loaded':
      return (
        <View testID="state-loaded" style={styles.loaded}>
          {view.token ? (
            <Text style={styles.tokenLine} selectable>Dispositivo: {abbreviate(view.token)} · {view.platform}</Text>
          ) : null}
          <FlatList
            data={view.items}
            keyExtractor={(it) => it.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => <InboxRow item={item} onPress={() => markRead(item.id)} />}
          />
          {Platform.OS !== 'web' ? <AppButton label="Enviar notificación de prueba" icon="notifications" variant="secondary" onPress={onTestPress} style={styles.stateBtn} /> : null}
        </View>
      );
  }
}

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  return (
    <Pressable style={[styles.item, !item.read && styles.itemUnread]} onPress={onPress}>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemText}>{item.body}</Text>
        <Text style={styles.timestamp}>{new Date(item.receivedAt).toLocaleString('es-BO')}</Text>
      </View>
      {!item.read ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function abbreviate(token: string): string {
  if (!token || token.length <= 24) return token;
  return `${token.slice(0, 12)}…${token.slice(-8)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.lg },

  userBlock: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userAvatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  userTexts: { flex: 1 },
  userLabel: { color: '#a8a29e', fontSize: 10, letterSpacing: 1.5, fontWeight: fontWeight.semibold },
  userName: { color: colors.paper, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: 2 },
  userEmail: { color: '#a8a29e', marginTop: 1, fontSize: fontSize.sm },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  logoutText: { color: colors.paper, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.ink, letterSpacing: -0.3 },
  countBadge: { minWidth: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { color: colors.paper, fontWeight: fontWeight.bold, fontSize: fontSize.xs, fontVariant: ['tabular-nums'] },

  stateBox: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
  stateIcon: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  stateTitle: { fontWeight: fontWeight.semibold, fontSize: fontSize.md, color: colors.ink },
  stateText: { color: colors.neutralFg, fontSize: fontSize.sm, lineHeight: 19 },
  stateBtn: { marginTop: spacing.sm },
  tokenLine: { color: colors.mute, fontSize: fontSize.xs, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  loaded: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  itemUnread: { backgroundColor: '#fff7ed', borderColor: colors.accentSoft },
  itemBody: { flex: 1 },
  itemTitle: { fontWeight: fontWeight.semibold, fontSize: fontSize.base, color: colors.ink },
  itemText: { color: colors.inkSoft, marginTop: 3, fontSize: fontSize.sm },
  timestamp: { color: colors.mute, fontSize: fontSize.xs, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.accent },

  toolbar: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'flex-end' },
  linkBtn: { paddingVertical: 6 },
  linkBtnText: { color: colors.ink, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});
