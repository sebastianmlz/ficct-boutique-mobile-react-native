import { REGISTER_PUSH_TOKEN, UNREGISTER_PUSH_TOKEN, MY_PUSH_TOKENS } from './notifications.gql';

function pretty(doc: { loc?: { source: { body: string } } }): string {
  // Apollo's `gql` tag exposes the raw query string at .loc.source.body
  return doc.loc?.source.body ?? '';
}

describe('notifications GraphQL documents', () => {
  it('REGISTER_PUSH_TOKEN expects an input matching the Go schema', () => {
    const body = pretty(REGISTER_PUSH_TOKEN);
    expect(body).toContain('registerPushToken(input: $input)');
    expect(body).toContain('$input: RegisterPushTokenInput!');
    expect(body).toMatch(/id[\s\S]*token[\s\S]*platform[\s\S]*isActive/);
  });

  it('UNREGISTER_PUSH_TOKEN exposes a token: String! variable', () => {
    const body = pretty(UNREGISTER_PUSH_TOKEN);
    expect(body).toContain('unregisterPushToken(token: $token)');
    expect(body).toContain('$token: String!');
  });

  it('MY_PUSH_TOKENS selects the fields the inbox UI relies on', () => {
    const body = pretty(MY_PUSH_TOKENS);
    expect(body).toContain('myPushTokens');
    for (const field of ['id', 'token', 'platform', 'isActive', 'lastSeenAt']) {
      expect(body).toContain(field);
    }
  });
});
