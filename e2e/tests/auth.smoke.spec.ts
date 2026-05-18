import { test, expect, type Page } from '@playwright/test';

/**
 * Deterministic demo credentials — created by server/prisma/seed.ts.
 * Keep in sync with the seed file if credentials change.
 */
const DEMO_USER = {
  email: 'demo@echolog.dev',
  password: 'password123',
};

/**
 * Shared login helper.
 * Navigates to /login, fills credentials, submits, and waits for
 * the post-login redirect to /w (Workspace Hub).
 */
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_USER.email);
  await page.getByLabel('Password').fill(DEMO_USER.password);
  // Wait for the login API to respond and set the auth cookie.
  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Sign in' }).click();
  await loginResponse;

  // SPA navigation may not trigger a full page load. Wait on a stable UI marker.
  await expect(page).toHaveURL(/\/w(\/.*)?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Your Workspaces' })).toBeVisible();
}

test.describe('Auth smoke', () => {
  test('login happy path', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Assert the login form renders with stable, accessible selectors
    await expect(page.getByRole('heading', { level: 2, name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    // Fill credentials using accessible label-based selectors
    await page.getByLabel('Email').fill(DEMO_USER.email);
    await page.getByLabel('Password').fill(DEMO_USER.password);

    // Submit the form
    const loginResponse = page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Sign in' }).click();
    await loginResponse;

    // Assert stable UI element on the workspace hub page (SPA-safe)
    await expect(page).toHaveURL(/\/w(\/.*)?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Your Workspaces' })).toBeVisible();
  });

  test('logout: sign out via sidebar and verify protected route is blocked', async ({ page }) => {
    // Start from authenticated state (shared login helper)
    await login(page);

    // Assert we're on the workspace hub
    await expect(page.getByRole('heading', { level: 1, name: 'Your Workspaces' })).toBeVisible();

    // Trigger logout via the sidebar's "Sign out" button.
    // The sidebar renders inside a unique <aside> element, so scoping
    // to that locator avoids ambiguity with any other "Sign out" button.
    await page.locator('aside').getByRole('button', { name: 'Sign out' }).click();

    // Confirm through the sign-out dialog.
    // The dialog has role="dialog" and its confirm button is also labeled
    // "Sign out". Scoping to the dialog avoids collision with the sidebar
    // button (both exist in the DOM while the dialog is open — portal).
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('[role="dialog"]').getByRole('button', { name: 'Sign out' }).click();

    // Assert redirect back to login page
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { level: 2, name: 'Welcome back' })).toBeVisible();

    // Verify that a protected route is blocked and redirects to login
    await page.goto('/w');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { level: 2, name: 'Welcome back' })).toBeVisible();
  });
});
