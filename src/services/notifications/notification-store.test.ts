import {
  initialNotificationState,
  notificationReducer,
  unreadCount,
  type NotificationAction,
} from './notification-store';
import type { InboxItem } from './notification-types';

function item(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: 'n1',
    title: 'Hola',
    body: 'Mundo',
    receivedAt: 1700000000000,
    read: false,
    ...overrides,
  };
}

describe('notificationReducer', () => {
  it('starts in the documented initial state', () => {
    expect(initialNotificationState.permission).toBe('undetermined');
    expect(initialNotificationState.token.kind).toBe('idle');
    expect(initialNotificationState.items).toEqual([]);
  });

  it('updates permission status', () => {
    const next = notificationReducer(initialNotificationState, {
      type: 'PERMISSION_SET',
      status: 'granted',
    });
    expect(next.permission).toBe('granted');
  });

  it('moves through the token lifecycle: idle -> loading -> ready', () => {
    let s = notificationReducer(initialNotificationState, { type: 'TOKEN_LOADING' });
    expect(s.token).toEqual({ kind: 'loading' });
    s = notificationReducer(s, {
      type: 'TOKEN_READY',
      token: 'ExponentPushToken[abc]',
      platform: 'android',
    } as NotificationAction);
    expect(s.token).toEqual({ kind: 'ready', token: 'ExponentPushToken[abc]', platform: 'android' });
  });

  it('captures unavailable + error token states distinctly', () => {
    const unavail = notificationReducer(initialNotificationState, {
      type: 'TOKEN_UNAVAILABLE',
      reason: 'emulator',
    });
    expect(unavail.token).toEqual({ kind: 'unavailable', reason: 'emulator' });

    const err = notificationReducer(initialNotificationState, {
      type: 'TOKEN_ERROR',
      message: 'boom',
    });
    expect(err.token).toEqual({ kind: 'error', message: 'boom' });
  });

  it('prepends new inbox items (newest first)', () => {
    let s = notificationReducer(initialNotificationState, {
      type: 'INBOX_PUSH',
      item: item({ id: 'n1' }),
    });
    s = notificationReducer(s, { type: 'INBOX_PUSH', item: item({ id: 'n2', title: 'segundo' }) });
    expect(s.items.map((it) => it.id)).toEqual(['n2', 'n1']);
  });

  it('replaces a duplicate id rather than appending a second copy', () => {
    let s = notificationReducer(initialNotificationState, {
      type: 'INBOX_PUSH',
      item: item({ id: 'n1', title: 'v1' }),
    });
    s = notificationReducer(s, {
      type: 'INBOX_PUSH',
      item: item({ id: 'n1', title: 'v2' }),
    });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].title).toBe('v2');
  });

  it('marks individual items read without touching others', () => {
    let s = notificationReducer(initialNotificationState, { type: 'INBOX_PUSH', item: item({ id: 'a' }) });
    s = notificationReducer(s, { type: 'INBOX_PUSH', item: item({ id: 'b' }) });
    s = notificationReducer(s, { type: 'INBOX_MARK_READ', id: 'b' });
    expect(s.items.find((it) => it.id === 'a')?.read).toBe(false);
    expect(s.items.find((it) => it.id === 'b')?.read).toBe(true);
  });

  it('marks all items read in one shot', () => {
    let s = notificationReducer(initialNotificationState, { type: 'INBOX_PUSH', item: item({ id: 'a' }) });
    s = notificationReducer(s, { type: 'INBOX_PUSH', item: item({ id: 'b' }) });
    s = notificationReducer(s, { type: 'INBOX_MARK_ALL_READ' });
    expect(s.items.every((it) => it.read)).toBe(true);
  });

  it('clears the inbox while preserving permission/token state', () => {
    let s = notificationReducer(initialNotificationState, { type: 'PERMISSION_SET', status: 'granted' });
    s = notificationReducer(s, { type: 'INBOX_PUSH', item: item() });
    s = notificationReducer(s, { type: 'INBOX_CLEAR' });
    expect(s.items).toEqual([]);
    expect(s.permission).toBe('granted');
  });

  it('RESET returns to the initial state', () => {
    let s = notificationReducer(initialNotificationState, { type: 'PERMISSION_SET', status: 'granted' });
    s = notificationReducer(s, { type: 'INBOX_PUSH', item: item() });
    s = notificationReducer(s, { type: 'RESET' });
    expect(s).toEqual(initialNotificationState);
  });
});

describe('unreadCount', () => {
  it('returns 0 when all items are read', () => {
    const s = {
      permission: 'granted' as const,
      token: { kind: 'idle' as const },
      items: [item({ read: true }), item({ id: 'n2', read: true })],
    };
    expect(unreadCount(s)).toBe(0);
  });

  it('counts each unread item exactly once', () => {
    const s = {
      permission: 'granted' as const,
      token: { kind: 'idle' as const },
      items: [item({ read: false }), item({ id: 'n2', read: false }), item({ id: 'n3', read: true })],
    };
    expect(unreadCount(s)).toBe(2);
  });
});
