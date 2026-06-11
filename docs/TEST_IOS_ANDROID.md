# Testing the FICCT Boutique mobile app on iOS and Android

This guide is written for the project owner. It explains, step by step, how to run
and test the React Native (Expo) customer app on **Android** and **iOS**, using both
**Expo Go** (physical devices) and **emulators/simulators**, and how to exercise the
features that depend on native permissions: push notifications, camera / AI visual
search, and GPS / branches.

It documents what works on this machine (Windows) and what genuinely requires a Mac,
so you don't waste time chasing something that cannot run locally.

> **Never put real passwords in this file or in the source.** Use the credentials from
> your local, git-ignored `TEST_ACCOUNTS.local.md` (kept out of band, not committed).
> The login form ships empty on purpose — there are no hardcoded credentials.

---

## 1. Prerequisites

### Tooling versions

| Tool | Version this project expects | How to check |
|------|------------------------------|--------------|
| Node.js | **20 LTS recommended** (18 LTS minimum). Expo SDK 51 supports Node 18 and 20. Avoid odd/very new majors. | `node -v` |
| npm | Bundled with Node 20 (npm 10) | `npm -v` |
| Expo CLI | Use the **bundled** CLI via `npx expo` — do **not** `npm i -g expo-cli` (the global `expo-cli` is deprecated) | `npx expo --version` |
| Git | any recent | `git --version` |

### Verify the project's Expo SDK and React Native versions

Read them straight from [`package.json`](../package.json) (the source of truth):

```powershell
# from the repo root
Get-Content package.json | Select-String "expo|react-native|typescript|navigation|apollo"
```

At time of writing this repo is on:

- `expo` `~51.0.39`  (Expo SDK **51**)
- `react-native` `0.74.5`
- `react` `18.2.0`
- `typescript` `~5.3.3`
- `@react-navigation/*` v6
- `@apollo/client` `^3.11.8`
- `expo-notifications`, `expo-location`, `expo-image-picker`, `expo-device`, `expo-secure-store`

The Expo Go app you install on your phone **must match SDK 51**. If your phone's Expo Go
has already auto-updated to a newer SDK, install the matching older Expo Go from the
store listing's version history, or use a development build (see iOS section).

### Install dependencies

```powershell
npm install
```

(Use `npm ci` for a clean, lockfile-exact install if `package-lock.json` is present.)

### Network requirement (LAN testing with Expo Go)

For the default Expo Go workflow, the **phone and the computer must be on the same
Wi-Fi network**, and the network must allow device-to-device traffic (many corporate,
university, and guest networks block this — see Troubleshooting). If LAN does not work,
use `npx expo start --tunnel`.

### Backend URLs and where they are configured

The app resolves its backend URLs in [`src/config/env.ts`](../src/config/env.ts) with
this precedence:

1. `EXPO_PUBLIC_GRAPHQL_URL` / `EXPO_PUBLIC_AI_API_URL` environment variables (from a
   git-ignored `.env`, see [`.env.example`](../.env.example)),
2. then `expo.extra.graphqlUrl` / `expo.extra.aiApiUrl` in [`app.json`](../app.json),
3. then an Android-emulator localhost fallback (`http://10.0.2.2:8080` / `:8000`).

Current production defaults baked into `app.json`:

| Service | URL |
|---------|-----|
| Go GraphQL core | `https://ficct-boutique-backend-go-production.up.railway.app/graphql` |
| Django AI (visual search) | `https://ficct-ai-1093089304525.us-central1.run.app/api/v1` |

To test against a **local backend**, create a git-ignored `.env` (never commit it):

```bash
# .env  — DO NOT COMMIT
EXPO_PUBLIC_GRAPHQL_URL=http://<your-LAN-IP>:8080/graphql
EXPO_PUBLIC_AI_API_URL=http://<your-LAN-IP>:8000/api/v1
```

> On a **physical phone**, `localhost` / `10.0.2.2` will not reach your PC. Use your
> computer's LAN IP (e.g. `192.168.1.20`) so the phone can reach the backend. `10.0.2.2`
> only works inside the Android **emulator** (it is the emulator's alias for the host).

> **Do not hardcode credentials** anywhere. Tokens are obtained at runtime via the login
> mutation and stored with `expo-secure-store`.

---

## 2. Android testing with Expo Go (physical device)

1. **Install Expo Go** from the Google Play Store on your Android phone. Confirm it is
   the SDK 51-compatible version (see Prerequisites).
2. **Start the dev server** from the repo root:

   ```powershell
   npm install
   npx expo start
   ```

   Leave this terminal open — it is the Metro bundler and your log window.
3. **Scan the QR code** printed in the terminal (or in the browser dev tools page that
   opens) using the **Expo Go** app's "Scan QR code" button. The JS bundle downloads and
   the app launches.
4. **Log in** with your test account (from `TEST_ACCOUNTS.local.md`; do not type real
   credentials into any committed file).
5. **Exercise the flows:**
   - **Catalog** ("Catálogo" tab) — product grid loads via `query products`.
   - **Product detail** — tap a card; pick a variant + branch.
   - **Cart** ("Carrito") — add items, change quantity, remove.
   - **Order flow** — Checkout → `createSale` then `confirmSale`; on success the cart
     clears and you land on Orders.
   - **AI visual search** ("Buscar" tab) — see §7.
   - **GPS / branches** ("Sucursales" tab) — see §8.
   - **Push notification permission / token registration** — see §6.
6. **View Metro logs:** they stream in the terminal where `npx expo start` runs.
   `console.log` from the app appears there. Press `j` to open the JS debugger, `m` to
   toggle the dev menu.
7. **Clear cache / reload:**
   - In the terminal: press `r` to reload, or restart with `npx expo start --clear` to
     wipe the Metro cache.
   - On the device: **shake** the phone (or press the menu key) to open the Expo dev
     menu → "Reload".
8. **Troubleshooting:**
   - **QR does not load** → ensure phone and PC are on the same Wi-Fi; try
     `npx expo start --tunnel` (routes through Expo's relay, works across networks).
   - **LAN blocked** (university/corporate/guest Wi-Fi) → use `--tunnel`, or a personal
     hotspot, or the Android emulator (§4).
   - **API / CORS / network issue** → confirm the backend URL in `env.ts`/`app.json`
     is reachable from the phone (open it in the phone's browser). For a local backend
     use your **LAN IP**, not `localhost`. Check the Go server's allowed origins.
   - **Android permission denied** → Settings → Apps → Expo Go → Permissions; re-grant
     Camera / Location / Notifications, then reload.
   - **Push token unavailable** → expected on emulators and without an EAS `projectId`;
     see §6. On a physical device in Expo Go, Android tokens still mint.

---

## 3. iOS testing with Expo Go (physical iPhone)

1. **Install Expo Go** from the Apple App Store (SDK 51-compatible build).
2. **Start the dev server** from the repo root:

   ```powershell
   npx expo start
   ```
3. **Scan the QR code** with the **iOS Camera app** (it offers to open in Expo Go) or
   from inside Expo Go. The bundle downloads and launches.
4. **Log in** with your test account (never a committed password).
5. **Test the same flows** as Android (§2 step 5): catalog, product detail, cart, order
   flow, AI visual search, GPS/branches, notifications.
6. **iOS permission notes** — the prompts are configured in
   [`app.json`](../app.json) plugins:
   - **Camera / Photo library** — `expo-image-picker` ("Permitir acceso a fotos para
     buscar prendas similares").
   - **Location** — `expo-location` ("Permitir ubicación para mostrar la sucursal más
     cercana").
   - **Notifications** — `expo-notifications`; iOS shows the system allow/deny prompt.
   - If you denied a permission, you cannot re-prompt from inside the app — go to
     **iOS Settings → Expo Go** (or the app) → toggle Camera/Photos/Location/Notifications.
7. **Safari / iOS networking notes** — on first launch iOS 14+ shows a **"Local Network"**
   permission prompt; you must **Allow** it or LAN Expo Go cannot connect. If LAN still
   fails, use `npx expo start --tunnel`. Plain `http://` to a LAN IP works in Expo Go
   (App Transport Security is relaxed for the Expo Go container), but a production build
   would need `https`.
8. **Troubleshooting:**
   - **Local network permission** not granted → Settings → Expo Go → Local Network → on.
   - **Push token not generated** → on iOS, Expo Go can obtain a token, but production
     delivery needs an EAS `projectId` + APNs key (see §6). On a simulator it is always
     unavailable.
   - **Camera permission** → Settings → (Expo Go) → Camera.
   - **Location permission** → Settings → (Expo Go) → Location → "While Using".
   - **API calls failing** → verify the backend URL is reachable from the phone; for a
     local backend use the LAN IP and confirm the firewall allows inbound on 8080/8000.

---

## 4. Android emulator testing

1. **Install Android Studio** (includes the Android SDK and AVD Manager).
2. **Create an emulator:** Android Studio → **Device Manager** → **Create device** →
   pick e.g. *Pixel 7*, choose a recent system image (API 34 / Android 14, **with Google
   Play** so notification services exist), finish, and **Start** the AVD.
3. **Run the app into the emulator:**

   ```powershell
   npx expo start --android
   ```

   With the AVD already running, Expo installs Expo Go into it and opens the app. (First
   run may prompt to install Expo Go in the emulator — allow it.)
   - The emulator reaches a backend on your PC via `http://10.0.2.2:8080` (the built-in
     fallback in `env.ts` already uses this).
4. **Push notification limitation on emulators:** `fetchExpoPushToken()` deliberately
   returns **`unavailable`** when `Device.isDevice` is false (see
   [`notifications.service.ts`](../src/services/notifications/notifications.service.ts)).
   So **remote push tokens do not mint on an emulator** — the Notifications screen shows
   an "unavailable" state. **Local** test notifications (the
   "Enviar notificación local de prueba" button) still work because they don't need a
   token or APNs/FCM. Test real remote push on a **physical device**.
5. **Troubleshooting ADB / emulator:**
   - Emulator not detected → `adb devices` should list `emulator-5554`. If empty, run
     `adb kill-server; adb start-server`, or cold-boot the AVD.
   - App won't open → `npx expo start --clear`, then press `a` in the Metro terminal to
     re-launch on Android.
   - Slow/black screen → enable hardware acceleration (Hyper-V / WHPX on Windows) in BIOS
     and Android Studio.

---

## 5. iOS simulator testing

**The iOS Simulator requires macOS + Xcode. It cannot run on Windows.** Do not expect an
iPhone simulator on this Windows machine — there is no supported way to run it locally.

Your options on Windows:

- **Physical iPhone with Expo Go** (§3) — the recommended path on Windows.
- **A macOS machine** (Mac, or a cloud Mac) with Xcode: install the iOS Simulator, then
  `npx expo start --ios` opens the app in it. (Note: the iOS *simulator*, like Android
  emulators, cannot mint a real push token — use a physical device for push.)
- **An EAS development build** if you need native modules beyond Expo Go's scope. This
  requires an Expo account and EAS configuration; **do not run paid EAS builds** as part
  of routine testing.

> Do **not** claim the iOS simulator works on Windows — it does not.

---

## 6. Push notification testing

How push works in this app is documented in detail in
[`docs/architecture/PUSH_NOTIFICATIONS.md`](architecture/PUSH_NOTIFICATIONS.md). Summary
for testing:

**Important limitations (be realistic about Expo Go):**
- Remote push tokens require a **physical device** — emulators/simulators return
  `unavailable` by design.
- The repo currently has **no `expo.extra.eas.projectId`** in `app.json`. In Expo Go,
  Android tokens still mint; **iOS production delivery and standalone builds require an
  EAS `projectId`** plus an APNs key. So production push may require EAS configuration
  (`npx eas init`, then `eas credentials:configure`).

**Steps (physical device):**
1. **Log in** with your test account.
2. Open the **"Avisos"** tab and **allow the notification permission** when prompted
   (or tap "Reintentar permiso" if it shows undetermined/denied).
3. **Verify token registration:** once permission is granted on a physical device, the
   app calls the Go `registerPushToken` mutation and shows a token preview on the screen.
   Confirm server-side by querying GraphQL:
   ```graphql
   query { myPushTokens { id token platform isActive lastSeenAt } }
   ```
   (Run it from the Go `/playground`, or watch the device's network log for a
   `POST /graphql` with `operationName: "RegisterPushToken"`.)
4. **Trigger a test push / campaign:**
   - Quickest, no server token needed: the **local** test notification button
     ("Enviar notificación local de prueba") schedules a notification in ~1s — proves the
     OS channel works.
   - Real end-to-end: call the `sendTestPushNotification(title, body)` mutation (any
     authenticated user — it only targets the caller's own active tokens). Admins can use
     `sendPushCampaign`.
5. **Verify the device receives** the notification (banner in foreground because the app
   installs a foreground handler; system tray in background).

If a usable token cannot be minted in Expo Go (typical on iOS without EAS), that's
expected — note it and verify the rest on Android physical / via the local test
notification. Real production push needs the EAS project configuration above.

---

## 7. Camera / AI visual search testing

The flow lives in `CameraSearchScreen` → `SimilarResultsScreen` (see
[`SCREENS.md`](architecture/SCREENS.md)) and posts a multipart image to Django.

1. Open the **"Buscar"** tab → **grant the camera / photo-library permission** when
   prompted (configured via `expo-image-picker` in `app.json`).
2. **Capture** a photo (native camera) or **select** an image from the gallery / file
   picker (web).
3. The image is sent to MS2 (Django):
   ```
   POST {aiApiUrl}/ai/similarity/search/
   Authorization: Bearer <token>
   Content-Type: multipart/form-data   (boundary auto-generated — never set manually)
   fields: image=<file>, top_k=5
   ```
4. **Verify matched products and similarity scores** render in `SimilarResultsScreen`;
   each result should be tappable through to `ProductDetailScreen`.
5. **Fallback note:** on **web export**, multipart file upload can behave differently
   (the file must be sent as a real `Blob`). If web upload fails to attach the file,
   test the camera/visual-search flow on a **physical device** (native `FormData` file
   URI) where it is known to work. Crucially, do **not** set `Content-Type` manually —
   the platform generates the multipart boundary.

---

## 8. GPS testing

The flow lives in `BranchesScreen` using `useLocation()` /
[`src/hooks/geo.ts`](../src/hooks/geo.ts) (haversine distance).

1. Open the **"Sucursales"** tab → **grant the location permission** when prompted
   (`expo-location`, "While Using").
2. The app requests the device location and computes a `distanceKm` per branch
   (haversine), then sorts branches ascending by distance.
3. **Verify branch distances** look reasonable for your real location.
4. **Physical device:** uses the real GPS.
5. **Emulator/simulator:** location can be **simulated** — Android emulator: "⋮" →
   *Location* → set lat/long or play a route; iOS simulator (Mac): *Features → Location*.
   If permission is denied, branches still list but without distances.

---

## 9. Local checks before testing (no device needed)

These run on the PC and catch breakage before you involve a phone:

```powershell
npm install
npm run lint        # eslint, --max-warnings=0
npm run typecheck   # tsc --noEmit
npm test            # jest (pure unit suites: notifications reducer, geo, ai, etc.)
npx expo-doctor     # checks SDK/deps health
```

> There is **no `npm run build`** — Expo apps are bundled by Metro, not "built" like a
> web app. To smoke-test that the JS bundle still compiles end-to-end, use:
> ```powershell
> npx expo export -p web    # produces dist/ ; proves the bundle builds
> ```
> Do **not** run paid `eas build` for routine testing.

---

## 10. Final test checklist

| Surface | What to confirm | Status |
|---------|-----------------|:------:|
| **Android physical device** (Expo Go) | App loads via QR, login, all tabs | ☐ |
| **iOS physical device** (Expo Go) | App loads via QR/Camera, login, all tabs | ☐ |
| **Android emulator** | App loads via `--android`, reaches backend via `10.0.2.2` | ☐ |
| **iOS simulator / macOS** | Only on a Mac with Xcode — N/A on Windows | ☐ |
| **Push notifications** | Permission prompt, token registration (physical), local test fires | ☐ |
| **Camera / AI visual search** | Permission, capture/select, matches + scores render | ☐ |
| **GPS / branches** | Permission, distances computed and sorted | ☐ |
| **Catalog / cart / order** | products load, cart math, createSale→confirmSale | ☐ |
| **API connectivity** | GraphQL (Go) + AI (Django) reachable from the device | ☐ |

---

## Quick command reference

```powershell
npm install                 # install deps
npx expo start              # dev server + QR (LAN)
npx expo start --tunnel     # dev server over Expo relay (when LAN is blocked)
npx expo start --android    # launch into a running Android emulator
npx expo start --clear      # clear Metro cache
npx expo start --ios        # iOS simulator (macOS only)
npm run lint                # eslint
npm run typecheck           # tsc --noEmit
npm test                    # jest unit suites
npx expo export -p web      # smoke-build the web bundle
npx expo-doctor             # environment/deps health check
```

In the Metro terminal: `r` reload · `a` open Android · `j` debugger · `m` dev menu.
On a device: shake to open the dev menu.
