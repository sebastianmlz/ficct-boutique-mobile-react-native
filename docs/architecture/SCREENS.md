# Screens

This document walks through every screen and the backend it touches.

## Navigation tree

```
RootNavigator
├── AuthStack (unauthenticated)
│   └── LoginScreen
└── AppTabs (authenticated)
    ├── Catálogo
    │   ├── CatalogScreen
    │   └── ProductDetailScreen
    ├── Buscar (AI search)
    │   ├── CameraSearchScreen
    │   └── SimilarResultsScreen
    ├── Carrito
    │   ├── CartScreen
    │   ├── CheckoutScreen
    │   └── OrdersScreen
    ├── Sucursales
    │   └── BranchesScreen
    └── Avisos
        └── NotificationsScreen
```

Source: [src/navigation/AppTabs.tsx](../../src/navigation/AppTabs.tsx) and [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx).

## Screens

### `LoginScreen`

Email + password form. Calls Go's `mutation login(input: { email, password })`. On success, `AuthProvider.login(...)` persists the token (plus `expiresAt`, plus a minimal user object) and the root navigator swaps from `AuthStack` to `AppTabs`.

There is no signup / forgot-password flow. Accounts are created server-side; the customer logs in with credentials given to them out of band.

### `CatalogScreen`

Pulls the public catalog with `query products(search, limit, offset)`. Uses `cache-and-network` so the previously fetched list shows instantly while a fresh query runs in the background. Tap a card → `ProductDetailScreen`.

The thumbnails come from `product.imageUrl`. For seeded products that's `/static/products/<sku>.svg` (served by Go itself). For products with admin-uploaded images, that's a presigned URL Express previously issued — visible to anyone with the URL during its 15-minute TTL.

### `ProductDetailScreen`

`query product(id)` returns the full product including variants and per-variant per-branch stock. The customer picks a variant (size/color) and a branch to fulfill from, then taps "Añadir al carrito" — that pushes a `CartItem` into `useCart()`.

### `CartScreen`

Reads from `useCart()`. Per-row controls let the customer change quantity or remove. Subtotal, tax (currently zero — the backend treats `tax = 0`), and total are derived in the hook.

### `CheckoutScreen`

Two-step:

1. `mutation createSale(input: { branchId, items: [{ variantId, quantity }] })` → `Sale` with `status='pending'`.
2. `mutation confirmSale(saleId)` → `Order` with `status='placed'`.

If `confirmSale` returns an error (typical case: "insufficient stock"), the cart is kept and the user sees the error message. If it succeeds, the cart is cleared and the user is bounced to `OrdersScreen`.

### `OrdersScreen`

`query orders(limit, offset)` — the Go backend gates this to admin/staff list responses. Customers only see their own orders because the backend filter (when implemented) scopes by `request.auth.sub`. **Note:** the current resolver doesn't filter — list visibility for non-admin/staff is whatever the backend returns. If that's a concern in production, the resolver needs an explicit `WHERE created_by = $sub` clause for non-admin roles. (Today this is a demo gap, not a customer-visible one — the seeded customer has no orders by default.)

### `CameraSearchScreen`

`expo-image-picker` is used to either capture from the camera (native) or pick from the gallery / file picker (web). The picked file is read into a Blob (`fetch(uri).then(r => r.blob())` on web, file URI on native) and POSTed to Django:

```
POST /api/v1/ai/similarity/search/
Authorization: Bearer <token>
Content-Type: multipart/form-data    (boundary auto-generated; do NOT set Content-Type manually)

form-data:
  image: <file>
  top_k: 5
```

The response is shown in `SimilarResultsScreen` — each result tappable to `ProductDetailScreen`.

### `BranchesScreen`

`query branches` returns the static list. `useLocation()` requests `expo-location` permission; if granted, every branch with `latitude`/`longitude` gets a `distanceKm` computed via the haversine formula and the list is sorted ascending.

There is no map view today. Just a list with addresses and distance.

### `NotificationsScreen`

A placeholder feed (in-app messages from the seed only, since there is no notifications table). The bottom of the screen has a session card with the current user's email + role and a "Cerrar sesión" button.

The card is the only place to log out — the tab bar has no logout button, and the catalog screens don't either. This is intentional because the design assumes a long-lived session.

---

## How Apollo is wired

[src/services/graphql/client.ts](../../src/services/graphql/client.ts):

```typescript
const httpLink = createHttpLink({ uri: env.graphqlUrl });
const authLink = setContext((_op, { headers }) => {
  const token = inMemoryToken.get();
  return { headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
});
const apolloClient = new ApolloClient({ link: authLink.concat(httpLink), cache: new InMemoryCache() });
```

The `inMemoryToken` is set by `AuthProvider` on `login()` and cleared on `logout()`. Since Apollo reads it on every operation, logout is immediate — there's no race between `tokenStorage.clear()` and an in-flight query.

## How the AI multipart fetch is wired

[src/services/ai/ai.service.ts](../../src/services/ai/ai.service.ts):

```typescript
const form = new FormData();
form.append('image', { uri, name, type } as any);
form.append('top_k', String(top_k));

await fetch(`${env.aiApiUrl}/ai/similarity/search/`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${inMemoryToken.get()}` },
  body: form,
});
```

Crucially, **no `Content-Type` is set manually**. React Native / the browser generates the multipart boundary when the body is a `FormData` instance.
