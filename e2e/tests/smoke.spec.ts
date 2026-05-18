import { test, expect } from '@playwright/test';

/**
 * Minimal smoke test — asserts the login page renders correctly.
 *
 * This test intentionally avoids any authenticated or DB-dependent
 * flows. DB reset/seed for full E2E scenarios (auth, CRUD, votes)
 * will be wired in a separate batch.
 *
 * @see playwright.config.ts — DB-strategy TODO
 */
test('login page loads', async ({ page }) => {
  await page.goto('/login');

  // Stable heading present on every render
  await expect(page.getByRole('heading', { level: 2, name: 'Welcome back' })).toBeVisible();

  // Critical form controls exist
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
