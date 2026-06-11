// Thin wrapper around expo-notifications. Everything that touches the native
// bridge lives here so the reducer/screen-state can be tested without mocking
// the whole Expo module.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import type { NotificationPlatform, PermissionStatus } from './notification-types';
import { buildInboxItem } from './notification-pure';

// Set globally once. Controls how notifications appear when the app is in the
// foreground on the OS. Without this, iOS suppresses banners while the app
// is open, which is confusing during demos.
let handlerInstalled = false;
/**
 * Installs the global foreground notification handler (idempotent) so banners,
 * sound, and badge behavior are defined while the app is open. Runs once.
 */
export function installForegroundHandler(): void {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerInstalled = true;
}

/**
 * Ensures the Android `default` notification channel exists with its name,
 * importance, vibration pattern, and light color. No-op on non-Android platforms.
 */
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

/**
 * Reads the current notification permission without prompting the user.
 * @returns The mapped status: `'granted' | 'denied' | 'undetermined'`.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  return mapStatus(settings.status, settings.granted);
}

/**
 * Prompts the user for notification permission (iOS alert/badge/sound).
 * @returns The resulting status: `'granted' | 'denied' | 'undetermined'`.
 */
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
/**
 * Obtains an Expo push token for the current platform, using the EAS project
 * id when available. Refuses to issue one on a non-web emulator/simulator.
 * @returns A discriminated outcome: `ready` with the token, `unavailable`, or `error`.
 */
export async function fetchExpoPushToken(): Promise<FetchTokenOutcome> {
  const platform = currentPlatform();
  try {
    if (platform !== 'web' && !Device.isDevice) {
      return {
        kind: 'unavailable',
        reason: 'Las notificaciones push solo funcionan en un dispositivo físico, no en el emulador.',
      };
    }
    // Expo Go (SDK 53+) removed remote push support entirely; report it as an
    // honest "unavailable" instead of letting getExpoPushTokenAsync throw.
    // Local event notifications (cart, pedidos) keep working in Expo Go.
    if (platform !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return {
        kind: 'unavailable',
        reason:
          'Las notificaciones push remotas no están disponibles en Expo Go. Los avisos de la app (carrito y pedidos) seguirán apareciendo aquí.',
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
/**
 * Schedules a local-only test notification (~1s delay) to verify the channel
 * works. Requires no push token, APNs, or FCM.
 */
export async function scheduleLocalTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'FICCT Boutique',
      body: 'Notificación de prueba local — el canal está funcionando.',
      data: { kind: 'local-test', at: new Date().toISOString() },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
  });
}

/**
 * Presents an immediate local notification for an in-app event (cart add,
 * order confirmed, etc.). Local-only: works in Expo Go, needs no push token,
 * APNs, or FCM. Requests permission on first use if still undetermined, and
 * shows as a banner in the foreground via the installed handler.
 * @param title Notification title.
 * @param body Notification body text.
 * @param data Optional payload merged into the notification's `data`.
 * @returns `true` if scheduled; `false` when permission is denied or it fails.
 */
export async function presentLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  try {
    installForegroundHandler();
    let status = await getPermissionStatus();
    if (status === 'undetermined') status = await requestPermission();
    if (status !== 'granted') return false;
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { kind: 'local-event', ...(data ?? {}) },
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export type ForegroundSubscription = { remove: () => void };

/**
 * Subscribes to notifications received while the app is in the foreground.
 * @param handler Callback invoked with each received notification.
 * @returns A subscription whose `remove()` unregisters the listener.
 */
export function subscribeToForegroundNotifications(
  handler: (n: Notifications.Notification) => void,
): ForegroundSubscription {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return { remove: () => sub.remove() };
}

/**
 * Subscribes to user taps on notifications (responses).
 * @param handler Callback invoked with the notification response.
 * @returns A subscription whose `remove()` unregisters the listener.
 */
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
