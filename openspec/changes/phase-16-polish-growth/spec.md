# Delta Specs: Phase 16 — Polish & Growth

> No prior base specs exist for these domains. All requirements below are written as full specs.

---

## email-verification (NEW)

### REQ-EMAIL-1: Token-based email verification flow
**Strength**: MUST

The system SHALL generate a unique, time-limited verification token upon registration. The token MUST be sent via Resend email to the user's address. Clicking the token link SHALL set `emailVerified = true` on the User record.

- **GIVEN** a new user registers successfully
- **WHEN** the registration completes
- **THEN** a verification email is sent with a unique token link

- **GIVEN** a user clicks a valid, unexpired token link
- **WHEN** the token is verified server-side
- **THEN** `emailVerified` is set to `true` and the user sees a confirmation

- **GIVEN** a user clicks an expired or invalid token link
- **WHEN** the server validates the token
- **THEN** an "expired" or "invalid" message is shown with a resend CTA

### REQ-EMAIL-2: Workspace creation limits
**Strength**: MUST

Unverified users SHALL be limited to 1 workspace. Verified users SHALL be allowed up to 20 workspaces.

- **GIVEN** an unverified user with 1 workspace
- **WHEN** they attempt to create a second workspace
- **THEN** the request is rejected with a descriptive limit message

- **GIVEN** a verified user with fewer than 20 workspaces
- **WHEN** they create a new workspace
- **THEN** creation succeeds

- **GIVEN** a verified user with 20 workspaces
- **WHEN** they attempt to create another
- **THEN** the request is rejected

### REQ-EMAIL-3: Verification optional for login
**Strength**: SHOULD

Login SHALL NOT be blocked by verification status. The gate applies only to workspace creation count.

- **GIVEN** an unverified user
- **WHEN** they log in
- **THEN** login proceeds normally; only workspace creation is limited

---

## public-board-detail (NEW)

### REQ-BOARD-1: Public board detail route
**Strength**: MUST

The route `/explore/:slug/:boardSlug` SHALL render a `PublicBoardView` displaying board metadata, posts, and pagination.

- **GIVEN** a public workspace with a board
- **WHEN** a visitor or logged-in user navigates to `/explore/:slug/:boardSlug`
- **THEN** board name, description, and paginated posts are rendered

- **GIVEN** an unknown or malformed slug
- **WHEN** the route is visited
- **THEN** a 404 state is shown with a back-link to `/explore`

### REQ-BOARD-2: Public board+posts API endpoint
**Strength**: MUST

A public, no-auth endpoint SHALL return board detail and associated posts for any board in a `PUBLIC` workspace.

- **GIVEN** a board in a `PUBLIC` workspace
- **WHEN** `GET /api/public/workspaces/:slug/boards/:boardSlug` is called
- **THEN** the response includes board metadata and a paginated list of posts

- **GIVEN** a board in a `PRIVATE` workspace or a nonexistent board
- **WHEN** the endpoint is called
- **THEN** the response is `404`

---

## verification-badge (NEW)

### REQ-BADGE-1: Verification status display
**Strength**: MUST

The settings page and profile SHALL display the user's verification status with a visual badge (verified ✓ / unverified ⚠).

- **GIVEN** a verified user viewing Settings or profile
- **WHEN** the page renders
- **THEN** a "Verified" badge is shown
- **AND** no resend CTA is visible

- **GIVEN** an unverified user viewing Settings or profile
- **WHEN** the page renders
- **THEN** an "Unverified" badge is shown with a "Resend verification" button

### REQ-BADGE-2: Resend verification CTA
**Strength**: MUST

The "Resend verification" button SHALL generate a new token, send it via Resend, and show a toast confirmation.

- **GIVEN** an unverified user clicks "Resend verification"
- **WHEN** the request completes
- **THEN** a new token is generated, email sent, and a success toast appears

---

## welcome-workspace (NEW)

### REQ-WELCOME-1: Seed "Bienvenido" public workspace
**Strength**: MUST

The seed script SHALL create a public workspace named "Bienvenido" with `INTERACT` access level, owned by `ezefernandezyf@gmail.com`. It SHALL include a brief community-oriented description explaining how to use EchoLog.

- **GIVEN** a fresh database seed is run
- **WHEN** the explore feed is loaded
- **THEN** the "Bienvenido" workspace is listed with INTERACT access

---

## auth (MODIFIED)

### REQ-AUTH-1: Remove `queryClient.clear()` from `useSession` error handler
**Strength**: MUST

When `useSession` receives an error (401), the hook SHALL call `clearSession()` on the auth store but SHALL NOT call `queryClient.clear()`. The React Query cache SHALL be preserved across auth errors.

- **GIVEN** the server returns 401 for the session query
- **WHEN** `useSession` handles the error
- **THEN** `clearSession()` is called but the React Query cache is NOT cleared
- **AND** the component tree re-renders with the error state, not a blank page

- **GIVEN** a user presses F5 on `/explore/:slug`
- **WHEN** the 401 error triggers the effect
- **THEN** the page shows the public workspace view (or error UI) without an infinite refetch loop

### REQ-AUTH-2: `PublicRoute` allows landing and `/explore` for logged-in users
**Strength**: MUST

The `PublicRoute` guard SHALL NOT redirect authenticated users visiting `/` or `/explore*` to `/w`. It SHALL still redirect them away from `/login` and `/register`.

- **GIVEN** an authenticated user
- **WHEN** they navigate to `/` or `/explore`
- **THEN** the landing page or explore feed renders normally

- **GIVEN** an authenticated user
- **WHEN** they navigate to `/login` or `/register`
- **THEN** they are redirected to `/w`

---

## workspace-settings (MODIFIED)

### REQ-WS-1: ConfirmDialog before visibility and access-level mutations
**Strength**: MUST

Changing `visibility` or `publicAccessLevel` SHALL trigger a `ConfirmDialog` explaining the consequences BEFORE the mutation is executed. Cancelling the dialog SHALL revert the selector to its previous value.

- **GIVEN** a workspace owner changes visibility from PRIVATE to PUBLIC
- **WHEN** the `<select>` onChange fires
- **THEN** a ConfirmDialog appears describing the change implications BEFORE the API call
- **AND** confirming executes the mutation; cancelling reverts to the prior value

- **GIVEN** a workspace owner changes access level (e.g., READ_ONLY → FULL)
- **WHEN** the `<select>` onChange fires
- **THEN** the same ConfirmDialog flow applies: confirm → mutate, cancel → revert

---

## authenticated-layout (MODIFIED)

### REQ-LAYOUT-1: Top navbar with branding, settings, profile, logout
**Strength**: MUST

The authenticated layout SHALL include a top navbar with "EchoLog" branding (navigating to `/w`), a settings/profile link, and a logout button. This navbar SHALL render above the sidebar + content area on all `/w` routes.

- **GIVEN** an authenticated user on any `/w` route
- **WHEN** the layout renders
- **THEN** a top navbar is visible with "EchoLog" branding on the left and settings/profile/logout links on the right

- **GIVEN** a user clicks the "EchoLog" branding
- **WHEN** they are inside any workspace or board
- **THEN** they navigate to `/w` (workspace hub)

### REQ-LAYOUT-2: Sidebar Explore link
**Strength**: MUST

The sidebar SHALL include an "Explore" link that navigates authenticated users to `/explore`.

- **GIVEN** an authenticated user with the sidebar visible
- **WHEN** the sidebar renders
- **THEN** an "Explore" link is present and navigates to `/explore`

---

## landing-page (MODIFIED)

### REQ-LANDING-1: "See how it works" targets `/explore`
**Strength**: MUST

The "See how it works" button on the landing page SHALL navigate to `/explore` instead of `/login`.

- **GIVEN** a visitor on the landing page
- **WHEN** they click "See how it works"
- **THEN** they are navigated to `/explore` (the public workspace lobby)

### REQ-LANDING-2: Em-dash cleanup in UI text
**Strength**: MUST

All visible UI text (JSX labels, placeholders, messages, alt text) SHALL NOT contain the em dash character (U+2014). Existing em dashes SHALL be replaced with hyphens (-) or removed. Code comments are exempt.

- **GIVEN** any component that renders JSX text
- **WHEN** the text is inspected
- **THEN** no em dash character (—) is present in user-visible content
