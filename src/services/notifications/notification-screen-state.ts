import type { InboxItem, NotificationScreenView, PermissionStatus, TokenStatus } from './notification-types';

const DENIED_HELP =
  'Las notificaciones están desactivadas. Para activarlas abre la Configuración del sistema → Apps → Notificaciones, permite los avisos para esta app y vuelve a intentar.';

export function deriveScreenView(input: {
  permission: PermissionStatus;
  token: TokenStatus;
  items: InboxItem[];
}): NotificationScreenView {
  const { permission, token, items } = input;

  if (permission === 'denied') {
    return { kind: 'denied', helpText: DENIED_HELP };
  }
  // Spinner ONLY while a token fetch is actively in flight. 'idle' must never
  // render as loading: if permission was not granted at login, the token stays
  // idle forever and the old mapping left the screen stuck on the spinner.
  if (token.kind === 'loading') {
    return { kind: 'loading' };
  }
  // The inbox is fed by local event notifications (cart, orders) that need no
  // push token, so received items are always shown regardless of token state.
  if (items.length > 0) {
    const unreadCount = items.reduce((n, it) => (it.read ? n : n + 1), 0);
    if (token.kind === 'ready') {
      return { kind: 'loaded', token: token.token, platform: token.platform, items, unreadCount };
    }
    return { kind: 'loaded', items, unreadCount };
  }
  if (token.kind === 'ready') {
    return { kind: 'empty', enabled: true, token: token.token, platform: token.platform };
  }
  // App-event notifications work whenever permission is granted — a remote
  // push token is only needed for server-sent campaigns, so its absence
  // (idle/unavailable/error) is never surfaced as a problem to the customer.
  return { kind: 'empty', enabled: permission === 'granted' };
}
