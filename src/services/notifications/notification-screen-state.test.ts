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
  it('idle ➜ loading', () => {
    expect(deriveScreenView(inputs({ permission: 'granted', token: { kind: 'idle' } })).kind).toBe('loading');
    expect(deriveScreenView(inputs({ permission: 'granted', token: { kind: 'loading' } })).kind).toBe('loading');
  });

  it('forwards unavailable reason verbatim', () => {
    const view = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'unavailable', reason: 'emulador' } }),
    );
    expect(view.kind).toBe('unavailable');
    if (view.kind === 'unavailable') expect(view.reason).toBe('emulador');
  });

  it('forwards error message verbatim', () => {
    const view = deriveScreenView(
      inputs({ permission: 'granted', token: { kind: 'error', message: 'no project id' } }),
    );
    expect(view.kind).toBe('error');
    if (view.kind === 'error') expect(view.message).toBe('no project id');
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
