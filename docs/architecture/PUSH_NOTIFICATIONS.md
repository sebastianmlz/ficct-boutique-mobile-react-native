# Push Notifications

This document describes how push notifications actually work in this codebase today: which modules are wired, what the backend contract is, what the user sees, and what is still required for end-to-end delivery in production.

## Architecture

```
+------------------------+        registerPushToken/unregister/myPushTokens (RS256 JWT)
|  RN customer app       | ──────────────────────────────────────────────────────────────┐
|  expo-notifications    |                                                                │
|  + expo-device         |                                                                ▼
|  + Apollo Client       |                                              +-----------------------------+
+------------------------+                                              |  Go core (MS1, Postgres)    |
            │                                                           |  table: push_tokens         |
            │ getExpoPushTokenAsync()                                    |  resolvers: registerPushToken
            │                                                           |             unregisterPushToken
            ▼                                                           |             myPushTokens     |
+---------------------------+                                           +-----------------------------+
|  Expo push service        |  <───── future: campaign sender posts here, using token from Postgres
|  https://exp.host/...     |
+---------------------------+
            │
            ▼
   APNs (iOS)  /  FCM (Android)  /  Web Push (web)
```

What is wired **today**:

- Mobile-side permission request, token retrieval, foreground/tap listeners, Android channel.
- Token registration round-trip to Go (`registerPushToken` mutation) right after a successful login OR when the user explicitly enables notifications from the screen.
- Token deactivation on logout.
- Notification center UI with empty/denied/error/unavailable/loaded states.
- Local test notification (scheduled +1 s) so QA can verify the channel without setting up the Expo push service.

What is wired **today (server-side delivery to a fake Expo + automated verification)**:

- `service.PushSender` in Go posts batched JSON to `EXPO_PUSH_API_URL` (default `https://exp.host/--/api/v2/push/send`; overridden to the in-cluster fake-expo container for local docker).
- Two GraphQL mutations: `sendTestPushNotification(title, body)` (any auth — sends to caller's own tokens) and `sendPushCampaign(input)` (**admin only** — sends to specified user ids or to every active token).
- A standalone `fake-expo-push-api` container ships in `docker-compose.full.yml`. It speaks the Expo wire protocol, returns valid tickets for "good" tokens and `DeviceNotRegistered` for tokens containing the literal `"BAD"`. An inspector endpoint at `GET /inspect/calls` lets tests assert exactly what got POSTed.
- The Go push sender deactivates any token that comes back with `DeviceNotRegistered`, so dead devices stop receiving campaign traffic after the first failure.
- Automated coverage: 9 unit tests in `internal/service/push_sender_test.go` (httptest-mocked Expo) + 7 RBAC tests in `graph/push_rbac_test.go` (httptest fake-Expo as a test fixture) + 6 Playwright tests against the live Expo Web bundle in `e2e/notifications.spec.ts`.

What is **not** wired today (real production delivery to real devices):

- EAS Build / `projectId`. Until `npx eas init` produces a project id in `app.json` (`expo.extra.eas.projectId`), iOS push tokens cannot be obtained from a release build. Android still works in Expo Go even without it.
- APNs key (`.p8`) and FCM service account credentials. These are configured per environment via `eas credentials:configure` and are NOT in this repo.
- Scheduled / cron-driven campaign trigger. The `sendPushCampaign` mutation exists; what doesn't exist is a worker that *automatically* fires it (e.g. "every Monday at 9am send the weekly promo"). Any user with admin auth can hit it manually right now.

## Mobile-side code map

| File | Responsibility | Touches native? |
|------|----------------|------------------|
| `src/services/notifications/notification-types.ts` | Shared TS types (`PermissionStatus`, `TokenStatus`, `InboxItem`, `NotificationScreenView`) | no |
| `src/services/notifications/notification-store.ts` | Pure reducer + `unreadCount` | no |
| `src/services/notifications/notification-screen-state.ts` | Pure `deriveScreenView(permission, token, items)` mapping → UI variant | no |
| `src/services/notifications/notification-pure.ts` | Helpers (token abbreviation, content-to-inbox conversion) | no |
| `src/services/notifications/notifications.service.ts` | `expo-notifications` + `expo-device` adapter: permission, foreground handler, Android channel, token retrieval, listener subscriptions, local test schedule | **yes** |
| `src/services/notifications/notifications.gql.ts` | `gql` documents: `REGISTER_PUSH_TOKEN`, `UNREGISTER_PUSH_TOKEN`, `MY_PUSH_TOKENS` | no |
| `src/services/notifications/notifications.context.tsx` | React provider: bootstraps permission/token at login, registers/unregisters on auth changes, exposes a hook | indirectly |
| `src/screens/notifications/NotificationsScreen.tsx` | UI consuming `useNotifications()` | no |

The split is intentional: every file that does not touch the native bridge is unit-tested in plain Node Jest (`testEnvironment: 'node'`), which avoids the `jest-expo`/`@testing-library/react-native` dependency surface.

## Backend contract (Go MS1)

Table — see [migrations/0004_push_tokens.up.sql](../../../../../go/ficct-boutique-backend-go/migrations/0004_push_tokens.up.sql):

```sql
CREATE TABLE push_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token        TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  device_id    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id, is_active);
```

GraphQL — see [graph/schema.graphqls](../../../../../go/ficct-boutique-backend-go/graph/schema.graphqls):

```graphql
enum PushPlatform { ios android web }

type PushToken {
  id: UUID!
  token: String!
  platform: PushPlatform!
  deviceId: String
  isActive: Boolean!
  lastSeenAt: Time!
  createdAt: Time!
}

input RegisterPushTokenInput {
  token: String!
  platform: PushPlatform!
  deviceId: String
}

extend type Query {
  myPushTokens: [PushToken!]!
}

extend type Mutation {
  registerPushToken(input: RegisterPushTokenInput!): PushToken!
  unregisterPushToken(token: String!): Boolean!
}
```

Authz: every operation requires `requireAuth(ctx)`. The user id is taken from the bearer `sub` — clients cannot register a token on behalf of someone else. Unregister also enforces ownership: the SQL update has both `token = $1` and `user_id = $2`, so a stolen token cannot be used to disable somebody else's notifications.

Repository (`internal/repository/push_tokens.go`):

- `Upsert(userID, token, platform, deviceID)` — `INSERT ... ON CONFLICT (token) DO UPDATE` so the same physical device re-registering after a re-install does not duplicate rows, and `is_active` is restored on re-registration.
- `Deactivate(userID, token)` — `UPDATE ... WHERE token = $ AND user_id = $`.
- `ListActiveByUser(userID)` — backs `myPushTokens`.

## What it looks like at runtime

1. User opens the "Avisos" tab. `NotificationsProvider` has already initialized in the background — it knows the current permission (`undetermined` / `granted` / `denied`) without prompting.
2. If permission is `granted` and the user is authenticated, the provider also has the Expo push token by now and has called `registerPushToken` on Go. The screen shows `empty` (no inbox messages yet) plus the token preview.
3. If permission is `undetermined`, the screen shows a loading then empty state with no token. The user taps "Reintentar permiso" to trigger the prompt.
4. If the system says `denied`, the screen shows a `denied` state with a help message and a "retry permission" button.
5. If we're in a simulator / emulator without push support, the screen shows an `unavailable` state with the reason text.
6. When a notification arrives in foreground, the `addNotificationReceivedListener` callback dispatches `INBOX_PUSH` and the row appears. Tapping a row marks it read (clears the orange dot + decrements the badge).
7. On logout, the provider dispatches `RESET` (clears the inbox + permission/token state) and calls `unregisterPushToken` on Go. The token row is marked `is_active=false` server-side.

## Server-side sender (Go, real today)

`internal/service/push_sender.go` is wired into the resolver via `resolver.PushSender`. It batches at the Expo-documented limit of 100 messages per POST, parses the ticket array, and on `DeviceNotRegistered` calls `PushTokenStore.DeactivateByToken(token)` so that the next campaign skips dead devices.

Two GraphQL operations expose it:

```graphql
mutation sendTestPushNotification($title: String!, $body: String!) {
  sendTestPushNotification(title: $title, body: $body) {
    sent failed deactivated errors
  }
}

mutation sendPushCampaign($input: SendPushCampaignInput!) {
  sendPushCampaign(input: $input) {
    sent failed deactivated errors
  }
}
```

`sendTestPushNotification` is any-auth and **only reaches the caller's own active tokens** — safe to expose to customers as a "verify my channel" button. `sendPushCampaign` is **admin only** (`requireAdmin`); attempts from staff or customer return GraphQL error `"forbidden"`. With `userIds = null`, the campaign broadcasts to every active token; with a list, only those user ids are targeted.

The endpoint is configurable:

| Env var | Default | Effect |
|---------|---------|--------|
| `EXPO_PUSH_API_URL` | `https://exp.host/--/api/v2/push/send` | Where the sender POSTs. |
| `EXPO_PUSH_ACCESS_TOKEN` | (empty) | Sent as `Authorization: Bearer …` when Expo "Enhanced Push Security" is on. |

In `docker-compose.full.yml` we override `EXPO_PUSH_API_URL` to `http://fake-expo-push:8080/--/api/v2/push/send` so the full stack proves the wire format end-to-end without touching the real Expo service.

## Fake Expo Push API (Docker integration fixture)

`cmd/fake-expo-push/main.go` is a single-binary Go program that mimics the subset of Expo's push API we use:

- `POST /--/api/v2/push/send` — returns Expo-shaped tickets.
- `GET /inspect/calls` — JSON of every batch received so tests can assert payloads.
- `POST /inspect/reset` — clears the inspector buffer.
- `POST /inspect/mode?value=ok|device_not_registered|per-token|http500` — switches behaviour per-test.
- `GET /healthz` — liveness.

Default mode is `per-token`: any push token whose body contains `"BAD"` (e.g. `ExponentPushToken[BAD-token]`) is returned with `DeviceNotRegistered`; everything else is `ok`. That single rule lets a single Docker stack exercise the happy path AND the deactivation path in one test run.

Container in compose: `fake-expo-push` → host port **8095**, in-cluster hostname `fake-expo-push:8080`.

## How to swap to the real Expo push service

Locally:

```powershell
$env:EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"
docker compose -f docker-compose.full.yml up -d --no-deps go-core
```

In Railway / GCP / AWS: leave `EXPO_PUSH_API_URL` unset; the `config.Load()` default is the real Expo URL.

## Local test notifications still work without the server

The "Enviar notificación local de prueba" button calls `Notifications.scheduleNotificationAsync` directly on the device — it does NOT traverse `EXPO_PUSH_API_URL` and does NOT need any server-side sender. Useful for QA on Expo Go without any backend at all.

## How to verify the flow locally

```powershell
# in the meta-compose, with Go running
docker compose -f ../../go/ficct-boutique-backend-go/docker-compose.full.yml up -d --build go-core go-postgres

# install + run RN web preview
cd react/react-native/ficct-boutique-mobile-react-native
npm ci
npx expo start --web
```

1. Sign in with your customer test account (see local `TEST_ACCOUNTS.local.md`).
2. Open the "Avisos" tab.
3. The provider auto-attempts permission + token retrieval. On web, you may see `denied` until you click "Permitir notificaciones" in the browser permission prompt.
4. Once granted, the registerPushToken mutation fires (visible in the browser network panel as `POST /graphql` with `operationName: "RegisterPushToken"`).
5. Query `myPushTokens` to confirm the row landed:
   ```graphql
   query { myPushTokens { id token platform isActive lastSeenAt } }
   ```

## Docker verification commands

After bringing the full stack up with `docker compose -f ../../go/ficct-boutique-backend-go/docker-compose.full.yml up -d --build`, run from this directory:

```bash
# 1. Unit + httptest tests (no docker needed)
cd ../../go/ficct-boutique-backend-go
go test ./internal/service/... -count=1 -run PushSender -v          # 9/9
go test ./graph/... -count=1 -run "SendPush|SendTest" -v            # 7/7

# 2. RN reducer / store / pure helpers / gql shapes
cd ../../react/react-native/ficct-boutique-mobile-react-native
npm run test                                                         # 31/31 in 6 suites

# 3. Expo Web bundle export (smoke that the bundle still builds)
npx expo export -p web

# 4. Playwright against the live Docker mobile-web container
npm run e2e                                                          # 6/6

# 5. End-to-end curl-driven proof: login → register → admin campaign → fake Expo
#    receives the payload → bad token is deactivated. See README.md "Docker
#    verification" section for the exact transcript.
curl -X POST http://localhost:8095/inspect/reset
# ... see README.md ...
curl -s http://localhost:8095/inspect/calls
```

## EAS + production checklist (NOT performed in this pass)

- `npx eas init` to set `expo.extra.eas.projectId`.
- `eas credentials:configure --platform ios` — upload an APNs auth key (`.p8`).
- `eas credentials:configure --platform android` — upload an FCM service account JSON.
- `eas build --platform android --profile preview` / `--platform ios` for a build that can receive real pushes.
- A scheduled worker (any cloud) that reads `push_tokens` and posts to `https://exp.host/--/api/v2/push/send`.
- Production-side handling of Expo push receipts to deactivate dead tokens.
