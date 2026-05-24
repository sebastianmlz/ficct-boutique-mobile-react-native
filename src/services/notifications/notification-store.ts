import type { InboxItem, PermissionStatus, TokenStatus } from './notification-types';

export interface NotificationState {
  permission: PermissionStatus;
  token: TokenStatus;
  items: InboxItem[];
}

export const initialNotificationState: NotificationState = {
  permission: 'undetermined',
  token: { kind: 'idle' },
  items: [],
};

export type NotificationAction =
  | { type: 'PERMISSION_SET'; status: PermissionStatus }
  | { type: 'TOKEN_LOADING' }
  | { type: 'TOKEN_READY'; token: string; platform: InboxItem extends never ? never : 'ios' | 'android' | 'web' }
  | { type: 'TOKEN_UNAVAILABLE'; reason: string }
  | { type: 'TOKEN_ERROR'; message: string }
  | { type: 'INBOX_PUSH'; item: InboxItem }
  | { type: 'INBOX_MARK_READ'; id: string }
  | { type: 'INBOX_MARK_ALL_READ' }
  | { type: 'INBOX_CLEAR' }
  | { type: 'RESET' };

export function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'PERMISSION_SET':
      return { ...state, permission: action.status };
    case 'TOKEN_LOADING':
      return { ...state, token: { kind: 'loading' } };
    case 'TOKEN_READY':
      return { ...state, token: { kind: 'ready', token: action.token, platform: action.platform } };
    case 'TOKEN_UNAVAILABLE':
      return { ...state, token: { kind: 'unavailable', reason: action.reason } };
    case 'TOKEN_ERROR':
      return { ...state, token: { kind: 'error', message: action.message } };
    case 'INBOX_PUSH': {
      // Replace if id collides; otherwise prepend (newest-first).
      const filtered = state.items.filter((it) => it.id !== action.item.id);
      return { ...state, items: [action.item, ...filtered] };
    }
    case 'INBOX_MARK_READ':
      return {
        ...state,
        items: state.items.map((it) => (it.id === action.id ? { ...it, read: true } : it)),
      };
    case 'INBOX_MARK_ALL_READ':
      return { ...state, items: state.items.map((it) => ({ ...it, read: true })) };
    case 'INBOX_CLEAR':
      return { ...state, items: [] };
    case 'RESET':
      return initialNotificationState;
    default:
      return state;
  }
}

export function unreadCount(state: NotificationState): number {
  return state.items.reduce((n, it) => (it.read ? n : n + 1), 0);
}
