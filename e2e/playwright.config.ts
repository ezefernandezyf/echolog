import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for EchoLog.
 *
 * DB strategy: ephemeral SQLite per test run (handled by scripts/start-dev.mjs).
 * The webServer command:
 *   1. Creates a temp SQLite DB
 *   2. Runs Prisma migrations (migrate deploy) on it
 *   3. Seeds demo data
 *   4. Starts @echolog/server (:3000) and @echolog/web (:5173)
 *
 * workers=1 is intentional — prevents parallel test files from colliding
 * on the single ephemeral DB. When per-worker DB isolation is implemented,
 * this constraint can be lifted.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Force single worker until per-worker DB isolation is implemented
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Tests should navigate via localhost to match server CORS allowlist.
    // Vite may still bind on ::1; localhost resolves correctly on this setup.
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],


});
