// Thin wrapper around expo-notifications. Everything that touches the native
// bridge lives here so the reducer/screen-state can be tested without mocking
// the whole Expo module.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import type { NotificationPlatform, PermissionStatus } from './notification-types';
import { buildInboxItem } from './notification-pure';

// Set globally once. Controls how notifications appear when the app is in the
// foreground on the OS. Without this, iOS suppresses banners while the app
// is open, which is confusing during demos.
let handlerInstalled = false;
export function installForegroundHandler(): void {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerInstalled = true;
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#9a3412',
  });
}

export function currentPlatform(): NotificationPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  return mapStatus(settings.status, settings.granted);
}

export async function requestPermission(): Promise<PermissionStatus> {
  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return mapStatus(settings.status, settings.granted);
}

function mapStatus(status: string, granted: boolean): PermissionStatus {
  if (granted || status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export type FetchTokenOutcome =
  | { kind: 'ready'; token: string; platform: NotificationPlatform }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'error'; message: string };

// Expo push tokens require either a physical device (native) or, on web,
// a valid Notifications API + a registered service worker. We refuse to fake
// a token in any other case.
export async function fetchExpoPushToken(): Promise<FetchTokenOutcome> {
  const platform = currentPlatform();
  try {
    if (platform !== 'web' && !Device.isDevice) {
      return {
        kind: 'unavailable',
        reason: 'Las notificaciones push solo funcionan en un dispositivo físico, no en el emulador.',
      };
    }
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    const tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return { kind: 'ready', token: tokenResp.data, platform };
  } catch (err) {
    return { kind: 'error', message: (err as Error).message ?? 'No se pudo obtener el token push' };
  }
}

// Local-only notification used for development verification. Does not need
// APNs/FCM, does not need a push token. Useful for QA and for letting users
// confirm the channel works.
export async function scheduleLocalTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'FICCT Boutique',
      body: 'Notificación de prueba local — el canal está funcionando.',
      data: { kind: 'local-test', at: new Date().toISOString() },
    },
    trigger: { seconds: 1 },
  });
}

export type ForegroundSubscription = { remove: () => void };

export function subscribeToForegroundNotifications(
  handler: (n: Notifications.Notification) => void,
): ForegroundSubscription {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return { remove: () => sub.remove() };
}

export function subscribeToNotificationTaps(
  handler: (response: Notifications.NotificationResponse) => void,
): ForegroundSubscription {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return { remove: () => sub.remove() };
}

export function notificationContentToInboxItem(
  id: string,
  content: Notifications.NotificationContent,
  receivedAt = Date.now(),
) {
  return buildInboxItem(
    id,
    {
      title: content.title ?? null,
      body: content.body ?? null,
      data: (content.data as Record<string, unknown> | undefined) ?? null,
    },
    receivedAt,
  );
}
