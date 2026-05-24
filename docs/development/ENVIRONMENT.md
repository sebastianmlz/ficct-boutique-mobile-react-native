# Environment variables

This app has only two URLs in its surface — the Go GraphQL endpoint and the Django AI endpoint. Both are read through one helper, [src/config/env.ts](../../src/config/env.ts):

```typescript
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra as Extra) ?? {};

export const env = {
  graphqlUrl:
    process.env.EXPO_PUBLIC_GRAPHQL_URL
    ?? extra.graphqlUrl
    ?? 'http://10.0.2.2:8080/graphql',
  aiApiUrl:
    process.env.EXPO_PUBLIC_AI_API_URL
    ?? extra.aiApiUrl
    ?? 'http://10.0.2.2:8000/api/v1',
};
```

## Precedence

For each URL, the first non-empty source wins:

1. `process.env.EXPO_PUBLIC_*` — set in the shell **before** building/serving the bundle. Expo's bundler inlines `EXPO_PUBLIC_*` variables at build time.
2. `Constants.expoConfig.extra.<key>` — comes from `app.json` → `expo.extra`.
3. Hard-coded fallback — `http://10.0.2.2:<port>/...`. Useful only for Android emulator development against host-loopback backends.

This means:

- **Native dev (`npm start` + Expo Go)** — set `EXPO_PUBLIC_*` envs in your shell to point at the dev machine's LAN IP.
- **Android emulator (`npm run android`)** — use the defaults if your backends are on `localhost:8080` / `localhost:8000`. Override with `EXPO_PUBLIC_*` for the meta-compose ports.
- **Web container (`Dockerfile.web`)** — the Dockerfile sets:
  ```
  EXPO_PUBLIC_GRAPHQL_URL=/graphql
  EXPO_PUBLIC_AI_API_URL=/api/ai/api/v1
  ```
  so the bundle is built with same-origin relative URLs. nginx (running in the same container) reverse-proxies them to `go-core` and `django-ai`.

## Reading the env elsewhere

Always import the helper rather than reading `process.env` or `Constants` directly:

```typescript
import { env } from '@/config/env';

const link = createHttpLink({ uri: env.graphqlUrl });
```

This keeps the precedence rule in one place. If you need an additional URL later (say, a new third-party service), add another field to `env` rather than threading another `process.env` lookup through the codebase.

## What is NOT an env variable

- The bearer token. Tokens are minted at login time and stored via `tokenStorage` — see [src/services/auth/token-storage.ts](../../src/services/auth/token-storage.ts).
- The role-gated UI. There's no role-gated UI in this app — every signed-in user sees the same five tabs.
- The locale. Strings are in Spanish (Bolivia). Adding i18n would mean installing `expo-localization` and routing through `t()` keys, which is not done today.
- Push-notification credentials. Notifications are not wired; if you add `expo-notifications`, the project ID would also become a build-time env (`EXPO_PUBLIC_PROJECT_ID` or similar).
