import type { InboxItem, NotificationScreenView, PermissionStatus, TokenStatus } from './notification-types';

const DENIED_HELP =
  'Activa las notificaciones desde la configuración del sistema para recibir avisos de promociones y de tus pedidos.';

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
  if (token.kind === 'unavailable') {
    return { kind: 'unavailable', reason: token.reason };
  }
  if (token.kind === 'error') {
    return { kind: 'error', message: token.message };
  }
  if (token.kind === 'ready') {
    return { kind: 'empty', token: token.token, platform: token.platform };
  }
  // token.kind === 'idle' — nothing requested yet (e.g. permission still
  // undetermined). Render the empty inbox with the enable CTA.
  return { kind: 'empty' };
}
