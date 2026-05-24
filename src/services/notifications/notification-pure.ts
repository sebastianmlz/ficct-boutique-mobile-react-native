// Pure helpers used by both the service and the UI. Kept free of any
// react-native / expo imports so they can be unit-tested in plain Node.
import type { InboxItem } from './notification-types';

export function abbreviateToken(token: string): string {
  if (token.length <= 24) return token;
  return `${token.slice(0, 12)}…${token.slice(-8)}`;
}

export interface NotificationContentLike {
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

export function buildInboxItem(
  id: string,
  content: NotificationContentLike,
  receivedAt: number,
): InboxItem {
  return {
    id,
    title: content.title?.trim() || 'Aviso',
    body: content.body?.trim() || '',
    receivedAt,
    data: content.data ?? undefined,
    read: false,
  };
}
