import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? '';
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD ?? '';

// Helper: fill the seeded mobile login form and submit.
async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/');
  // RN Web renders TextInput as a bare <input>. With keyboardType="email-address"
  // it becomes type="email"; the password TextInput becomes type="password".
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill(email);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);
  // TouchableOpacity on web renders as <div role="button"> WITHOUT an
  // accessible name, so getByRole('button') misses it. Click via the inner
  // Text node label instead — the bubble reaches the touchable.
  await page.getByText('Ingresar', { exact: true }).first().click();
}

test.describe('Mobile customer — notification center', () => {
  test('login screen renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 30_000 });
  });

  test('customer logs in and reaches the catalog', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    // The catalog title is "Catálogo" — wait for any product card to appear.
    await expect(page.getByText(/Catálogo/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('Avisos tab renders the real notification center (not a placeholder)', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    // Bottom tab "Avisos" — labeled exactly that.
    await page.getByText('Avisos', { exact: true }).first().click();

    // Must show the real notification-center header text.
    await expect(page.getByText('Centro de notificaciones')).toBeVisible({ timeout: 15_000 });

    // The OLD placeholder copy must be GONE — this is the regression guard
    // that proves we replaced it.
    await expect(
      page.getByText(/integración con Expo Push está pendiente/i),
    ).toHaveCount(0);

    // One of the documented states must be in the DOM. On Expo Web with no
    // permission granted yet, that's typically `state-denied` (Chromium
    // disables Notifications.requestPermission outside a user gesture) or
    // `state-unavailable`. We accept any of the canonical states.
    const anyState = page.locator(
      '[data-testid="state-loading"], ' +
        '[data-testid="state-denied"], ' +
        '[data-testid="state-unavailable"], ' +
        '[data-testid="state-error"], ' +
        '[data-testid="state-empty"], ' +
        '[data-testid="state-loaded"]',
    );
    // Playwright on web exposes the testID via `data-testid` (RN Web maps it).
    await expect(anyState.first()).toBeVisible({ timeout: 15_000 });
  });

  test('session card exposes the seeded customer + logout button', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.getByText('Avisos', { exact: true }).first().click();
    await expect(page.getByText(CUSTOMER_EMAIL)).toBeVisible();
    await expect(page.getByText(/Cerrar sesión/i)).toBeVisible();
  });

  test('the screen never shows a raw GraphQL error to the user', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.getByText('Avisos', { exact: true }).first().click();
    // Raw Apollo/network errors would look like "ApolloError" or
    // "Network error" in the DOM. The screen should translate them.
    await expect(page.getByText(/ApolloError/)).toHaveCount(0);
    await expect(page.getByText(/Network error/)).toHaveCount(0);
  });
});

test.describe('Mobile admin viewing the customer surface', () => {
  // Admin can still log in via the same login form (the mobile app is
  // role-agnostic on the client side). We use this to verify that an
  // admin's "Avisos" tab still shows a real notification center.
  test('admin login also reaches Avisos with the real screen', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByText('Avisos', { exact: true }).first().click();
    await expect(page.getByText('Centro de notificaciones')).toBeVisible({ timeout: 15_000 });
  });
});
