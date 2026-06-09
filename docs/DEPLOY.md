# React Native (Expo) — Deployment

## Production API config

Set in `app.json` → `expo.extra` (or override at build via `EXPO_PUBLIC_*`,
consumed by `src/config/env.ts`):

- `graphqlUrl`: `https://ficct-boutique-backend-go-production.up.railway.app/graphql`
- `aiApiUrl`: `https://ficct-ai-1093089304525.us-central1.run.app/api/v1`

> MS2 AI is currently **private** (GCP org policy blocks public `allUsers`); the
> mobile AI calls need the org-policy exception (or an authenticated gateway).

Env override example:
```
EXPO_PUBLIC_GRAPHQL_URL=https://ficct-boutique-backend-go-production.up.railway.app/graphql
EXPO_PUBLIC_AI_API_URL=https://ficct-ai-1093089304525.us-central1.run.app/api/v1
```

## Verify / run / build

```powershell
npm run lint        # passes
npm run typecheck   # passes
npm start           # Expo dev server
npm run web         # web preview
npx expo export     # static web/JS bundle export (no paid build)
```

Native binaries require EAS build (`eas build`) — **not run here** (avoids paid
mobile builds).

## Native integrations (configured in `app.json` plugins)

- **Camera / photos** — `expo-image-picker` (similar-garment image search). iOS
  `photosPermission` set; Android via picker.
- **GPS / location** — `expo-location` (nearest branch). Permission strings set.
- **Push notifications** — `expo-notifications` (icon/color set); iOS
  `UIBackgroundModes: ["remote-notification"]`, Android `NOTIFICATIONS`
  permission. Tokens registered against the Go core notifications GraphQL.
