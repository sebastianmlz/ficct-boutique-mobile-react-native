# System Overview — Customer App

This app is the customer-facing surface of the FICCT Boutique system. It talks to two of the three backends:

- **Go (MS1)** via GraphQL for catalog, cart, sales, orders, branches.
- **Django (MS2)** via REST for the camera-based similarity search.

It does **not** talk to **Express (MS3)** at all. Document storage is admin-only and not surfaced in the customer flows.

```
+-----------------------+      +----------------+
|  RN Customer App      |      |  Go (MS1)      |
|  this repo            | ---> |  GraphQL       |
|                       |      |  Postgres      |
|                       |      +----------------+
|                       |
|                       |      +----------------+
|                       | ---> |  Django (MS2)  |
|                       |      |  AI / Dynamo   |
+-----------------------+      +----------------+
```

## What this app does NOT do

- It does not have admin features. There is no products CRUD, no inventory management, no audit log, no AI analytics tabs. Those live in the Angular admin web app.
- It does not call Express. It does not show documents. The Go catalog's `imageUrl` (which may point at an Express download URL) is loaded directly by `<Image source={{ uri }}>` — the URL resolution happens server-side before the customer sees it.

## Two delivery modes

This single codebase ships in two ways:

### 1. Native (Expo Go or a development build)

The user installs Expo Go on iOS / Android and scans the QR shown by `npm start`. The bundle is delivered over LAN; everything else (storage, navigation, network) is native.

- `expo-secure-store` works → tokens go to iOS Keychain / Android EncryptedSharedPreferences.
- `expo-image-picker` opens the real camera/gallery.
- `expo-location` accesses GPS.

### 2. Expo Web behind nginx (in the full-system compose)

The same TypeScript bundle is exported with `npx expo export -p web`, producing a static `dist/`. nginx serves it and reverse-proxies the API calls:

```
/graphql        → http://go-core:8080/graphql
/api/ai/...     → http://django-ai:8000/...
/static/...     → http://go-core:8080/static/...
```

Same-origin = no CORS friction in the browser. The user reaches the app at `http://localhost:4300` and sees a near-native phone-shaped experience (the layout is mobile-first).

- `expo-secure-store` is unavailable → token storage falls back to `AsyncStorage` (IndexedDB).
- `expo-image-picker` falls back to the browser file picker.
- `expo-location` works if the user grants browser permission.

## Why a reverse proxy?

Before the nginx setup, the bundle made cross-origin requests to `http://localhost:8093/graphql` directly. That works on a developer laptop but introduces two problems:

1. CORS preflight on every multipart upload, which is finicky and adds latency.
2. The bundle has to know the host ports of every backend — making it impossible to ship one image that runs in different environments.

With the reverse proxy:

- Bundle URLs are relative (`/graphql`, `/api/ai/...`) so it works behind any host name.
- nginx forwards the `Authorization` header so the auth model is unchanged.
- Image uploads (50 MiB cap in nginx) flow through the same origin as the rest of the app.

## Identity

Tokens come from Go's `mutation login`. The customer account is seeded by `cmd/seed` — use your local customer test credentials (see local `TEST_ACCOUNTS.local.md`). The token's role claim is `customer`; the Go GraphQL backend silently filters writable operations for customers (only `me` and the public catalog queries succeed).

The same login screen would accept the admin or staff test accounts — there is no client-side check that bounces non-customers. The role is irrelevant for the screens this app shows. (The Angular admin app is the place where admin/staff features live.)
