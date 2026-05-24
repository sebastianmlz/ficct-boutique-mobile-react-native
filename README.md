# FICCT Boutique — Customer App (React Native / Expo)

Customer-facing app for the FICCT Boutique system. Browse the catalog, add to cart, place orders, and search for similar products by uploading a photo.

This is the **customer** entry point. The admin web app (Angular) is a separate repo. Both apps consume the same backends.

## What is real in this repo

What this app does today:

- Sign in with the seeded customer (or any user the Go backend recognizes). Tokens are stored in `expo-secure-store` on native and in `AsyncStorage` on web.
- Browse products via the Go GraphQL `products` and `product(id)` queries.
- Maintain a local cart in `AsyncStorage` and run checkout via `createSale` + `confirmSale`.
- View past orders (`orders` query, scoped to the signed-in user by the backend).
- Search for similar products by uploading an image to Django's `POST /api/v1/ai/similarity/search/`.
- Show a list of branches with distance from the device (when location permission is granted).
- A **real notification center** ("Avisos" tab) backed by `expo-notifications`: permission flow, Expo push token retrieval, foreground/tap subscriptions, mark-read / clear actions, badge with the unread count, and a "send local test notification" button (native only). See [docs/architecture/PUSH_NOTIFICATIONS.md](docs/architecture/PUSH_NOTIFICATIONS.md).

What this app does **not** do:

- It does **not** ship a server-side push campaign sender. The Go service stores the device's Expo push token (table `push_tokens`, mutations `registerPushToken` / `unregisterPushToken`, query `myPushTokens`), but there is no scheduled job that actually POSTs to the Expo push service. The mobile side is wired end-to-end; the outbound delivery is the integration that is left for production (documented in [docs/architecture/PUSH_NOTIFICATIONS.md](docs/architecture/PUSH_NOTIFICATIONS.md)).
- It does **not** auto-prompt for the notification permission at app start — only the "Avisos" tab requests it on demand via a button, so the first impression is not a permission dialog.
- It does **not** ship to the App Store or Play Store today. The icons/splash referenced in `app.json` are placeholders.
- There is **no** persistent Apollo cache. The cart is the only data persisted between launches.
- There is **no** silent token refresh. When the access token expires, the user is signed out and asked to log in again.
- There is **no** real camera capture on web. `expo-image-picker` falls back to file selection on web; the actual camera tab works on Expo Go / a native dev build.

---

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | React Native 0.74 + Expo 51 + TypeScript |
| Navigation | React Navigation (`@react-navigation/native-stack` + `bottom-tabs`) |
| GraphQL | Apollo Client (`@apollo/client`) |
| Storage | `expo-secure-store` (native) → `AsyncStorage` (web); cart always in `AsyncStorage` |
| Media | `expo-image-picker` (camera + gallery) |
| Location | `expo-location` + a local `haversineKm` for branch-distance sort |
| Test | Jest + ts-jest (`--passWithNoTests` configured — there's a `useLocation.test.ts` only) |
| Lint | ESLint via `eslint-config-expo` |
| Web container | `Dockerfile.web` builds the Expo Web export and serves it through nginx |

---

## Directory layout

```
App.tsx                              GestureHandlerRootView → SafeAreaProvider → ApolloProvider → AuthProvider → NavigationContainer → RootNavigator
app.json                             Expo config (icon, splash, plugins, extra.graphqlUrl/aiApiUrl defaults)
nginx.conf                           reverse proxies /graphql + /static/ + /api/ai/ (web container only)
Dockerfile                           native dev container (Metro)
Dockerfile.web                       web container: `expo export -p web` → nginx
src/
  config/env.ts                      EXPO_PUBLIC_* envs → app.json extra → defaults
  navigation/
    RootNavigator.tsx                AuthStack ↔ AppTabs depending on AuthProvider.isAuthenticated
    AuthStack.tsx                    LoginScreen
    AppTabs.tsx                      5 tabs: Catálogo, Buscar, Carrito, Sucursales, Notificaciones
  screens/
    auth/LoginScreen.tsx
    catalog/CatalogScreen.tsx
    product/ProductDetailScreen.tsx
    cart/CartScreen.tsx
    cart/CheckoutScreen.tsx
    orders/OrdersScreen.tsx
    ai-search/CameraSearchScreen.tsx
    ai-search/SimilarResultsScreen.tsx
    branches/BranchesScreen.tsx
    notifications/NotificationsScreen.tsx
  services/
    auth/auth.context.tsx            AuthProvider, useAuth(), login()/logout(), boot rehydration
    auth/token-storage.ts            tokenStorage (persistent) + inMemoryToken (Apollo link reads this)
    graphql/client.ts                ApolloClient with the bearer link
    ai/ai.service.ts                 multipart POST to Django for similarity search
    storage/cart-storage.ts          CartItem[] persisted in AsyncStorage
  hooks/
    useCart.ts                       hydrated cart + subtotal/tax/total
    useLocation.ts                   permission gate + haversine distance
    useLocation.test.ts              the lone Jest spec
    geo.ts
  models/
  components/
```

---

## Running it

### Native (Expo Go on a physical phone)

```powershell
npm install --no-audit --no-fund
npm start                  # expo start
```

Then scan the QR with Expo Go on iOS/Android. Set `EXPO_PUBLIC_GRAPHQL_URL` / `EXPO_PUBLIC_AI_API_URL` before `npm start` if the backends are not at the defaults; for a physical device, use the dev machine's LAN IP (the Android emulator alias `10.0.2.2` only works on the emulator, not on Expo Go over LAN).

### Native via Android emulator

```powershell
npm run android
```

Defaults to `http://10.0.2.2:8080/graphql` for GraphQL and `http://10.0.2.2:8000/api/v1` for AI — these resolve to the host machine from inside an Android emulator. **Not the meta-compose host ports.** If you want to point at the meta-compose, override with `EXPO_PUBLIC_*` envs:

```powershell
$env:EXPO_PUBLIC_GRAPHQL_URL = 'http://10.0.2.2:8093/graphql'
$env:EXPO_PUBLIC_AI_API_URL  = 'http://10.0.2.2:8092/api/v1'
npm run android
```

### Web (Expo Web)

```powershell
npm run web
```

A Vite-flavored Metro bundle is served at `http://localhost:8081`. **`expo-secure-store` is unavailable on web**, so the token storage falls back to `AsyncStorage` — your tokens are in IndexedDB.

### Web (production-style container in the meta-compose)

The `Dockerfile.web` runs `npx expo export -p web` and serves the static bundle through nginx. In the full-system compose:

| Container | Host port | Backends reached |
|-----------|-----------|------------------|
| `ficct-full-mobile` (this) | **4300** | Same-origin `/graphql` (proxied to Go), `/api/ai/...` (proxied to Django), `/static/...` (proxied to Go) |

The nginx in front of this container is the reason the bundle uses same-origin URLs:

```
EXPO_PUBLIC_GRAPHQL_URL=/graphql
EXPO_PUBLIC_AI_API_URL=/api/ai/api/v1
```

are set in `Dockerfile.web` at build time. The browser never has to know there are three different backends on three different host ports — nginx fans the requests out.

---

## Auth model

`AuthProvider` is the top-level context:

- On boot, calls `tokenStorage.load()`. If a valid token is present and not expired (local clock check against `expiresAt`), the user is rehydrated.
- `login(email, password)` calls Go's `mutation login` via Apollo, then persists token + `expiresAt` + minimal user object.
- `logout()` clears storage **and** the in-memory token, which immediately stops Apollo's `setContext` link from attaching a bearer.

The token is **dual-stored**:

1. `tokenStorage` → persistent (SecureStore on native, AsyncStorage on web).
2. `inMemoryToken` → ephemeral, read by Apollo on every request.

This is why logout is instant — Apollo doesn't have to wait for a SecureStore round-trip.

---

## Cart and checkout

The cart is an `AsyncStorage`-backed `CartItem[]`. `useCart()` hydrates it on mount and gives back `items`, `subtotal`, `tax`, `total`, plus mutators.

Checkout calls two mutations in sequence:

```
mutation createSale(input: { branchId, items }) → Sale (status='pending')
mutation confirmSale(saleId)                    → Order (status='placed')
```

`confirmSale` runs the atomic stock decrement on the backend. If it fails (insufficient stock), the user is shown the error and the cart is preserved so they can adjust.

---

## Visual similarity search

```
CameraSearchScreen
  expo-image-picker → image bytes
  POST /api/v1/ai/similarity/search/  (multipart: image, top_k=5)
  → SimilarResultsScreen
```

The multipart upload deliberately **does not** set a `Content-Type` header. React Native's `fetch` generates the multipart boundary header itself; manually setting `multipart/form-data` (without the boundary) would corrupt the request.

The backend embedding is pHash + HSV histogram — not a CNN — so similarity captures color and overall shape, not fine detail. Two blouses in the same colour family with different cuts will both score high.

---

## Location and branches

`useLocation()` wraps `expo-location` with a permission gate. On grant, the device coordinates are returned; on deny, the branches screen still renders, but distances are omitted.

`haversineKm(a, b)` is the standard great-circle formula. There is no map view — only a sorted list.

---

## Known limitations

- **End-to-end mobile delivery to real APNs / FCM is not configured.** That step belongs to EAS Build + Expo Application Services. Until those are wired, iOS notifications only run from an EAS dev/preview build; Android still works in Expo Go.
- **EAS `projectId` is read at runtime if present.** It is not hard-coded — see `notifications.service.ts` (`getExpoPushTokenAsync({ projectId })`). Run `npx eas init` to populate it.
- **No scheduled / cron-driven campaign trigger.** The `sendPushCampaign` GraphQL mutation works (and admin can fire it manually right now); what's missing is a worker that automatically runs it on a schedule.
- No persistent Apollo cache. Catalog queries hit the network on every cold start.
- No silent JWT refresh. On `exp`, the user is signed out.
- Web does not have access to a real device camera — `expo-image-picker` falls back to the browser file picker on web.

## Docker-verified push notification surface

Everything below was proved against the live full-stack compose (`docker-compose.full.yml`) on **2026-05-23**:

| Layer | How | Result |
|-------|-----|--------|
| **Server push sender** (`internal/service/PushSender`) | 9 Go unit tests against `httptest.NewServer` (happy path, `DeviceNotRegistered` deactivation, HTTP 500, malformed JSON, 250-token batching at 100/batch, `Authorization` header pass-through, no-tokens-isn't-an-error) | 9/9 pass |
| **GraphQL RBAC** (`sendPushCampaign`, `sendTestPushNotification`) | 7 Go resolver tests using a synthetic claims context + httptest fake-Expo fixture | 7/7 pass; customer + staff + anonymous all rejected with `forbidden`/`unauthenticated`; admin succeeds and the fake-Expo captures the expected payload |
| **Fake Expo container** (`cmd/fake-expo-push/`) | Built and runs in `docker-compose.full.yml` as `fake-expo-push` on host port 8095. Inspector at `GET /inspect/calls`. | Healthy |
| **End-to-end smoke (curl)** | Login as `cliente`, register `ExponentPushToken[smoke-good]`, register `ExponentPushToken[BAD-token]`, admin runs `sendPushCampaign` | Result: `sent=1, failed=1, deactivated=1`. `fake-expo` `/inspect/calls` shows one HTTP POST with both messages, title `"Otoño 2026"`. After the campaign the BAD token is `is_active=false`. |
| **Customer self-test (`sendTestPushNotification`)** | Customer fires `Ping/Pong` → fake-Expo receives exactly one message targeted at the customer's own token | passes — confirms test mutation never reaches another user's tokens |
| **Mobile side state machine** | 31 Jest tests across 6 suites (`notification-store`, `notification-screen-state`, `notification-pure`, `notifications.gql`, `ai.service`, `useLocation`) | 31/31 pass |
| **Expo Web bundle** | `npx expo export -p web` produces `dist/` (1.67 MB, 1094 modules) | builds cleanly |
| **Playwright @ 390×844** | 6 specs against the live `mobile-web` nginx container (login renders; customer reaches catalog; Avisos shows real notification center; old placeholder copy is gone; session card with logout; no raw GraphQL/Apollo error text; admin login also reaches Avisos) | 6/6 pass |

What is **not** verified in Docker (proven impossible to verify without a physical iOS/Android device + EAS credentials):

- Real Expo push delivery → APNs → iPhone lockscreen.
- Real Expo push delivery → FCM → Android notification shade.
- `expo-notifications` foreground/tap listener firing on a real device.
- iOS-specific permission prompt UI.

Everything strictly *before* "device receives the push" is Docker-verified.

## Automated QA

| Layer | Tooling | What's covered |
|-------|---------|----------------|
| Notification reducer | Jest (`notification-store.test.ts`) | 11 cases |
| Notification screen-state derivation | Jest (`notification-screen-state.test.ts`) | 7 cases |
| Pure helpers (token abbreviation, content → inbox item) | Jest (`notification-pure.test.ts`) | 6 cases |
| GraphQL document shape | Jest (`notifications.gql.test.ts`) | 3 cases |
| Pre-existing modules | Jest (`ai.service.test.ts`, `useLocation.test.ts`) | 4 cases |
| **Playwright @ 390×844 vs live Docker bundle** | `e2e/notifications.spec.ts` against `mobile-web` container | 6 cases |

```
npm run test            # 31 tests across 6 suites
npm run typecheck
npm run lint
npx expo export -p web  # builds the static bundle
npm run e2e             # Playwright vs live mobile-web container
```

All five commands pass on the current tree. Note: `npm run e2e` requires the full docker compose to be up (it expects `localhost:4300` to be the mobile-web container and `localhost:8093` to be the Go core).

---

## Documentation index

- [docs/architecture/SYSTEM_OVERVIEW.md](docs/architecture/SYSTEM_OVERVIEW.md) — how this app fits with the three backends.
- [docs/architecture/SCREENS.md](docs/architecture/SCREENS.md) — what each screen calls and renders.
- [docs/development/RUNNING_LOCALLY.md](docs/development/RUNNING_LOCALLY.md) — bring-up + smoke tests on native, web, and the meta-compose.
- [docs/development/ENVIRONMENT.md](docs/development/ENVIRONMENT.md) — env var precedence and how URLs flow into the bundle.
