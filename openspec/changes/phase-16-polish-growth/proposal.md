# Proposal: Phase 16 — Polish & Growth

## Intent

Fix 4 high-impact bugs + UX papercuts, upgrade 4 UX flows, and add 3 growth features (email verification, welcome workspace, verification badge). Phase 15 delivered public workspaces but left rough edges that undermine the product experience for both anonymous visitors and authenticated users.

## Scope

### In Scope
- **16-A Quick Wins (4)**: Fix F5 blank page (queryClient.clear loop), "See how it works" link, PublicRoute redirect, em dash cleanup
- **16-B UX Upgrades (4)**: Visibility confirmation modal, pubic board navigation (`/explore/:slug/:boardSlug`), Explore link for logged-in users, top navbar for authenticated users
- **16-C Growth Features (3)**: Welcome public workspace seed, email verification gate (token + Resend + workspace limit), verification badge UI

### Out of Scope
- Email verification for existing users (no backfill migration)
- Admin dashboard or analytics
- Public workspace search/filtering beyond current capabilities

## Capabilities

### New Capabilities
- `email-verification`: Token-based email flow via Resend, `emailVerified` field on User, workspace creation limit (1 unverified / 20 verified)
- `public-board-detail`: Route `/explore/:slug/:boardSlug`, public board+posts API, PublicBoardView component
- `verification-badge`: Verified/unverified status UI in settings/profile with resend-verification CTA
- `welcome-workspace`: Seed data for public "Bienvenido" workspace (INTERACT level, ezefernandezyf@gmail.com owner)

### Modified Capabilities
- `auth`: `useSession` error handler stops clearing React Query cache; `PublicRoute` allows landing + /explore for logged-in users
- `workspace-settings`: Visibility and `publicAccessLevel` mutations require ConfirmDialog before execution
- `authenticated-layout`: Top navbar with branding + profile/logout added; sidebar gains Explore link
- `landing-page`: "See how it works" CTA targets `/explore` instead of `/login`

## Approach

Three sequential delivery groups ordered by risk and dependency:

1. **16-A Quick Wins**: Pure fixes with zero schema changes. Each is a single-file edit. Ship first for immediate UX improvement.
2. **16-B UX Upgrades**: New routes/components but no schema changes. Depends on 16-A.3 (auth guard fix) for public board nav to work for all users.
3. **16-C Growth Features**: Schema migration for `emailVerified` + new token model. Seed data is additive. Highest risk — deploy last.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/src/hooks/use-auth.ts` | Modified | Remove `queryClient.clear()`, handle 401 without cache destruction |
| `web/src/auth/auth-guard.tsx` | Modified | PublicRoute: skip redirect for `/`, `/explore*` |
| `web/src/shared/components/landing-page.tsx` | Modified | Button href: `/login` → `/explore` |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modified | Add ConfirmDialog before visibility mutations |
| `web/src/core/router.tsx` | Modified | Add `/explore/:slug/:boardSlug` route |
| `web/src/public/` | New files | PublicBoardView component |
| `server/src/workspaces/` | Modified | Public board+posts endpoint, create() limit check |
| `server/src/auth/` | Modified | Verification token endpoint, Resend email |
| `server/prisma/schema.prisma` | Modified | `emailVerified` field, `VerificationToken` model |
| `server/prisma/seed.ts` | Modified | Add welcome public workspace |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema migration breaks existing seed/users | Low | Additive column with default `false`, no destructive changes |
| `queryClient.clear()` removal regresses auth state | Low | Verify session refetch works after 401 → redirect to login |
| Public board endpoint leaks private data | Low | Reuse existing public workspace access control, add membership bypass check |
| Resend delivery failures block signup | Med | Graceful fallback — verification is optional for login, gating only on workspace count |

## Rollback Plan

- **16-A**: Revert individual commits. Each fix is isolated — revert any without affecting others.
- **16-B**: Remove new route and component files, revert router/config changes. No data migration needed.
- **16-C**: Drop `VerificationToken` table, drop `emailVerified` column, revert seed. Workspaces created under old limit remain valid.

## Dependencies

- Resend API key already configured (Phase 14)
- Phase 15 public workspace infrastructure (visibility enum, public endpoints, access levels)

## Success Criteria

- [ ] F5 on `/explore/:slug` no longer shows blank page; error handled gracefully
- [ ] Logged-in users can view landing page and `/explore` without forced redirect
- [ ] All em dashes removed from visible UI text (0 occurrences in JSX labels/placeholders/messages)
- [ ] Board navigation works inside public workspace view (`/explore/:slug/:boardSlug`)
- [ ] Visibility/access level changes show confirmation dialog before executing
- [ ] Authenticated layout shows top navbar with branding + settings/profile/logout
- [ ] Welcome workspace visible in public explore feed with INTERACT access
- [ ] Unverified users limited to 1 workspace; verified users can create up to 20
- [ ] Verification badge visible in settings/profile with resend CTA
- [ ] All existing tests pass; new tests cover verification flow and public board endpoint
