import { defineConfig, devices } from '@playwright/test';

// e2e for the Expo Web build served by the mobile-web nginx container in the
// full FICCT compose. The bundle proxies /graphql to the Go core, so the
// notification register/list flows hit a real backend.
//
// Run from project root, with the full compose already up:
//   docker compose -f ../../go/ficct-boutique-backend-go/docker-compose.full.yml up -d
//   npm run e2e
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4300',
    headless: true,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'mobile-390',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
});
