import { abbreviateToken, buildInboxItem } from './notification-pure';

describe('abbreviateToken', () => {
  it('returns the original string when short', () => {
    expect(abbreviateToken('abc')).toBe('abc');
  });

  it('abbreviates long Expo push tokens', () => {
    const token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]';
    const out = abbreviateToken(token);
    expect(out).toContain('…');
    expect(out.length).toBeLessThan(token.length);
    expect(out.startsWith('ExponentPush')).toBe(true);
  });
});

describe('buildInboxItem', () => {
  it('maps title + body + data + receivedAt onto a fresh unread item', () => {
    const item = buildInboxItem(
      'n1',
      { title: 'Pedido confirmado', body: 'Tu sucursal te avisará', data: { kind: 'order' } },
      1234,
    );
    expect(item).toEqual({
      id: 'n1',
      title: 'Pedido confirmado',
      body: 'Tu sucursal te avisará',
      receivedAt: 1234,
      data: { kind: 'order' },
      read: false,
    });
  });

  it('falls back to "Aviso" when title is missing or whitespace', () => {
    expect(buildInboxItem('n1', { title: '', body: 'x' }, 0).title).toBe('Aviso');
    expect(buildInboxItem('n1', { title: '   ', body: 'x' }, 0).title).toBe('Aviso');
    expect(buildInboxItem('n1', { body: 'x' }, 0).title).toBe('Aviso');
  });

  it('coalesces missing body to an empty string rather than undefined', () => {
    expect(buildInboxItem('n1', { title: 't' }, 0).body).toBe('');
  });

  it('omits data when content has none', () => {
    expect(buildInboxItem('n1', { title: 't', body: 'b' }, 0).data).toBeUndefined();
  });
});
