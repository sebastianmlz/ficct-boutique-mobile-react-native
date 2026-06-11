import { deriveScreenView } from './notification-screen-state';
import type { InboxItem } from './notification-types';

function inputs(over: Partial<Parameters<typeof deriveScreenView>[0]> = {}) {
  return {
    permission: 'undetermined' as const,
    token: { kind: 'idle' as const },
    items: [] as InboxItem[],
    ...over,
  };
}

const baseItem: InboxItem = {
  id: 'n1',
  title: 'Pedido listo',
  body: 'Recoger en Boutique Centro',
  receivedAt: 1700000000000,
  read: false,
};

describe('deriveScreenView — permission gates everything', () => {
  it('returns denied view as soon as permission is denied (regardless of token state)', () => {
    const view = deriveScreenView(inputs({ permission: 'denied', token: { kind: 'ready', token: 't', platform: 'android' } }));
    expect(view.kind).toBe('denied');
    if (view.kind === 'denied') expect(view.helpText).toMatch(/configuración del sistema/i);
  });
});

describe('deriveScreenView — token lifecycle drives UI when permission is OK', () => {
  it('loading only while a token fetch is actively in flight', () => {
    expect(deriveScreenView(inputs({ permission: 'granted', token: { kind: 'loading' } })).kind).toBe('loading');
  });

  it('idle never renders the spinner: it falls back to empty without token', () => {
    const idleGranted = deriveScreenView(inputs({ permission: 'granted', token: { kind: 'idle' } }));
    expect(idleGranted.kind).toBe('empty');
    if (idleGranted.kind === 'empty') {
      expect(idleGranted.token).toBeUndefined();
      expect(idleGranted.enabled).toBe(true);
    }

    const idleUndetermined = deriveScreenView(inputs({ permission: 'undetermined', token: { kind: 'idle' } }));
    expect(idleUndetermined.kind).toBe('empty');
    if (idleUndetermined.kind === 'empty') expect(idleUndetermined.enabled).toBe(false);
  });

  it('inbox items always show, even when the token is unavailable or errored', () => {
    const unavailable = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'unavailable', reason: 'Expo Go' }, items: [baseItem] }),
    );
    expect(unavailable.kind).toBe('loaded');
    if (unavailable.kind === 'loaded') {
      expect(unavailable.items).toHaveLength(1);
      expect(unavailable.token).toBeUndefined();
      expect(unavailable.unreadCount).toBe(1);
    }

    const errored = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'error', message: 'boom' }, items: [baseItem] }),
    );
    expect(errored.kind).toBe('loaded');
  });

  it('token unavailable/error is never surfaced as a problem when permission is granted', () => {
    const unavailable = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'unavailable', reason: 'emulador' } }),
    );
    expect(unavailable.kind).toBe('empty');
    if (unavailable.kind === 'empty') expect(unavailable.enabled).toBe(true);

    const errored = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'error', message: 'no project id' } }),
    );
    expect(errored.kind).toBe('empty');
    if (errored.kind === 'empty') expect(errored.enabled).toBe(true);
  });
});

describe('deriveScreenView — ready token branches by inbox content', () => {
  it('empty inbox => empty state with token + platform', () => {
    const view = deriveScreenView(
      inputs({
        permission: 'granted',
        token: { kind: 'ready', token: 'ExponentPushToken[abc]', platform: 'ios' },
        items: [],
      }),
    );
    expect(view.kind).toBe('empty');
    if (view.kind === 'empty') {
      expect(view.token).toBe('ExponentPushToken[abc]');
      expect(view.platform).toBe('ios');
    }
  });

  it('non-empty inbox => loaded state with correct unread count', () => {
    const view = deriveScreenView(
      inputs({
        permission: 'granted',
        token: { kind: 'ready', token: 'ExponentPushToken[abc]', platform: 'android' },
        items: [
          { ...baseItem, id: 'a', read: false },
          { ...baseItem, id: 'b', read: true },
          { ...baseItem, id: 'c', read: false },
        ],
      }),
    );
    expect(view.kind).toBe('loaded');
    if (view.kind === 'loaded') {
      expect(view.unreadCount).toBe(2);
      expect(view.items).toHaveLength(3);
    }
  });
});
