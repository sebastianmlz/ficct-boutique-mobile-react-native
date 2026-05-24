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
  if (token.kind === 'idle' || token.kind === 'loading') {
    return { kind: 'loading' };
  }
  if (token.kind === 'unavailable') {
    return { kind: 'unavailable', reason: token.reason };
  }
  if (token.kind === 'error') {
    return { kind: 'error', message: token.message };
  }
  // token.kind === 'ready'
  if (items.length === 0) {
    return { kind: 'empty', token: token.token, platform: token.platform };
  }
  const unreadCount = items.reduce((n, it) => (it.read ? n : n + 1), 0);
  return {
    kind: 'loaded',
    token: token.token,
    platform: token.platform,
    items,
    unreadCount,
  };
}
