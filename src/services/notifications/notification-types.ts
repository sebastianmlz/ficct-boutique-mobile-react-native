export type NotificationPlatform = 'ios' | 'android' | 'web';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export type TokenStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'ready'; token: string; platform: NotificationPlatform }
  | { kind: 'error'; message: string };

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  receivedAt: number;
  data?: Record<string, unknown>;
  read: boolean;
}

export type NotificationScreenView =
  | { kind: 'loading' }
  | { kind: 'denied'; helpText: string }
  | { kind: 'empty'; enabled: boolean; token?: string; platform?: NotificationPlatform }
  | { kind: 'loaded'; token?: string; platform?: NotificationPlatform; items: InboxItem[]; unreadCount: number };
