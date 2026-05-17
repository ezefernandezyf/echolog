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
  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Sign in' }).click();
  await loginResponse;

  // SPA navigation may not trigger a full page load. Wait on a stable UI marker.
  await expect(page).toHaveURL(/\/w(\/.*)?$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Your Workspaces' })).toBeVisible();
}

test.describe('Workspace/board navigation smoke', () => {
  test('login → workspace hub → workspace detail → board via sidebar', async ({
    page,
  }) => {
    // ── Step 1: Login with seeded demo user ──────────────────────
    await login(page);

    // ── Step 2: Assert workspace hub heading ─────────────────────
    // The /w page renders the WorkspaceHub component with h1 "Your Workspaces"
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your Workspaces' }),
    ).toBeVisible();

    // ── Step 3: Click the Demo Workspace card ────────────────────
    // The WorkspaceCard renders as a <div role="button"> with aria-label.
    //
    // NOTE: The aria-label is "Demo Workspace, Owner" — NOT
    // "Demo Workspace, 1 active board". The server's workspace list
    // endpoint does NOT return activeBoardsCount, so captionText()
    // falls back to roleLabel(role) which renders "Owner".
    await page
      .getByRole('button', { name: 'Demo Workspace, Owner' })
      .click();

    // ── Step 4: Assert URL matches /w/<workspaceId> pattern ──────
    // The workspace card navigates to /w/{workspace.id} (UUID or Prisma ID).
    await expect(page).toHaveURL(/\/w\/[a-zA-Z0-9-]+$/);

    // ── Step 5: Wait for sidebar to render with board items ──────
    // After navigation, the AuthenticatedLayout sidebar switches from
    // showing workspaces to showing boards. The boards query fires,
    // loading state shows skeleton aside, then the real Sidebar renders.
    // Wait until the "Feature Requests" board button is visible inside
    // the <aside> element.
    await expect(
      page
        .locator('aside')
        .getByRole('button', { name: 'Feature Requests' }),
    ).toBeVisible();

    // Click the sidebar board button for "Feature Requests".
    // When arriving at /w/<workspaceId>, the first board is auto-selected,
    // so clicking it again is a no-op for URL (onSelectBoard only
    // navigates if the current path differs from /w/<workspaceId>).
    await page
      .locator('aside')
      .getByRole('button', { name: 'Feature Requests' })
      .click();

    // ── Step 6: Assert URL stays /w/<workspaceId> ────────────────
    await expect(page).toHaveURL(/\/w\/[a-zA-Z0-9-]+$/);

    // Assert the board heading "Feature Requests" is visible.
    // BoardLayout passes selectedBoard.name to PostList which renders
    // it inside an <h1>.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Feature Requests' }),
    ).toBeVisible();

    // ── Step 7: Assert empty state ───────────────────────────────
    // The seed creates a board with no posts. PostList renders
    // "No posts yet." when filtered.length === 0 and no search is active.
    await expect(page.getByText('No posts yet.')).toBeVisible();
  });
});
