# Running the customer app locally

Three delivery modes:

| Mode | Command | Best for |
|------|---------|----------|
| Native (Expo Go on a phone) | `npm start` | Demoing the real camera + GPS |
| Android emulator | `npm run android` | iterating in Android Studio without a phone |
| Web (Expo Web → nginx) | `docker compose -f ../../go/ficct-boutique-backend-go/docker-compose.full.yml up --build mobile-web` | Cross-platform QA, headless Playwright |

## Prerequisites

- Node 20+
- Either:
  - Expo Go installed on a phone on the same Wi-Fi as the dev machine, **or**
  - Android Studio with an AVD running, **or**
  - Docker (for the web/meta-compose path).

## Mode 1 — Expo Go on a phone

```powershell
npm install --no-audit --no-fund
npm start
```

Metro prints a QR code. Open Expo Go (iOS App Store / Play Store) and scan it.

If your backends aren't on the defaults, set env vars **before** `npm start`:

```powershell
$env:EXPO_PUBLIC_GRAPHQL_URL = 'http://<dev-machine-LAN-IP>:8093/graphql'
$env:EXPO_PUBLIC_AI_API_URL  = 'http://<dev-machine-LAN-IP>:8092/api/v1'
npm start
```

(`localhost` won't work from a phone — use the LAN IP. The phone reaches your backends through the LAN.)

## Mode 2 — Android emulator

```powershell
npm install --no-audit --no-fund
npm run android
```

The defaults in `src/config/env.ts` (`http://10.0.2.2:8080/graphql`, `http://10.0.2.2:8000/api/v1`) assume each backend is published on **the host machine's default container port** (`8080`, `8000`). The meta-compose remaps to 8093/8092 — for that, override:

```powershell
$env:EXPO_PUBLIC_GRAPHQL_URL = 'http://10.0.2.2:8093/graphql'
$env:EXPO_PUBLIC_AI_API_URL  = 'http://10.0.2.2:8092/api/v1'
npm run android
```

`10.0.2.2` is the special alias the Android emulator uses to reach the host's loopback interface.

## Mode 3 — Web (Expo Web)

Standalone:

```powershell
npm install --no-audit --no-fund
npm run web
```

Bundler serves at `http://localhost:8081`. The bundle uses whatever URLs `env.ts` resolves at runtime — same precedence as Modes 1 and 2.

In the meta-compose (`ficct-full-mobile` container at host port **4300**):

```powershell
# from D:\Repositories\go\ficct-boutique-backend-go
docker compose -f docker-compose.full.yml up -d --build mobile-web
```

The container's bundle is built with `EXPO_PUBLIC_GRAPHQL_URL=/graphql` and `EXPO_PUBLIC_AI_API_URL=/api/ai/api/v1` so that nginx (in front of the bundle) reverse-proxies same-origin requests to the appropriate backends.

## Signing in

Use the seeded customer test account (see local `TEST_ACCOUNTS.local.md`). Admin/staff logins also work but the screens they see are still the customer screens — there's no role-based routing on the mobile side.

## Smoke checks

After login:

- **Catálogo** should list the 4 seeded products (`BLZ-001`, `PNT-001`, `VST-001`, `FLD-001`) with their SVG thumbnails.
- **Sucursales** should list 2 branches (`SC-01 Boutique Centro`, `SC-02 Boutique Equipetrol`). Distances appear only after granting location permission.
- **Buscar** should open the camera (native) or file picker (web). Choose any image; results may be empty if catalog sync has not been run (no embeddings stored yet). Run the sync from Django docs to populate.
- **Carrito** is empty on first launch. Add a variant from any product detail screen, then check out — `Mis órdenes` should now show one order.

## Lint, typecheck, test

```powershell
npm run lint        # eslint --max-warnings=0
npm run typecheck   # tsc --noEmit
npm run test        # jest --runInBand --passWithNoTests
```

`npm test` runs a single Jest spec at `src/hooks/useLocation.test.ts`. There is no broader test suite; QA is performed by manual flows + the Playwright `customer-rbac.spec.ts` in the Angular repo (which targets the Expo Web build, not the native build).

## Troubleshooting

- **"Network request failed"** on login from a phone — your `EXPO_PUBLIC_GRAPHQL_URL` is wrong for that delivery mode. Phones need the LAN IP; emulators need `10.0.2.2`; web wants `/graphql` (proxied) or `http://localhost:8093/graphql`.
- **Camera tab opens the file picker instead of the camera** — that's Expo Web behaviour. To exercise the real camera, run on Expo Go.
- **Image upload returns 400 from Django** — usually means the multipart was malformed because someone added a manual `Content-Type` header. Remove it; the platform generates the boundary.
- **Login screen is stuck on "Cargando..."** — `AuthProvider` is still rehydrating. If it doesn't move after a few seconds, your token storage backend is failing silently. Reload the bundle and check the Metro logs.
