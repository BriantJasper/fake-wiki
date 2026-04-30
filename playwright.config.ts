import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: process.env.CI
    ? {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        timeout: 120_000,
        reuseExistingServer: false,
      }
    : undefined,
});
