# Tasks: Phase 16 — Polish & Growth

## Review Workload Forecast

- Estimated changed lines: 450–550
- 400-line budget risk: Medium
- Chained PRs recommended: No
- Chain strategy: stacked-to-main

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | 16-A Quick Wins (4 UX fixes) | PR 1 | ~30 lines, no schema, 4 single-file edits |
| 2 | 16-B UX Upgrades (public board, TopNavbar, ConfirmDialog) | PR 2 | ~200 lines, no schema, depends on 16-A.2 |
| 3 | 16-C Growth Features (email verification, badge, seed) | PR 3 | ~220 lines + auto migration, schema change |

## 16-A: Quick Wins (no schema)

- [x] 16-A.1 — `web/src/hooks/use-auth.ts`: Remove `queryClient.clear()` from 401 handler, keep only `clearSession()`
- [x] 16-A.2 — `web/src/auth/auth-guard.tsx`: PublicRoute uses `useLocation()` — whitelist `/login`/`/register` for redirect; allow `/`, `/explore*` when logged in
- [x] 16-A.3 — `web/src/shared/components/landing-page.tsx`: CTA href `/login` → `/explore`
- [x] 16-A.4 — `grep — *.tsx *.ts`: Replace em dashes (U+2014) in visible JSX with hyphens; skip code comments

## 16-B: UX Upgrades (no schema)

- [x] 16-B.1 — `web/src/workspaces/components/workspace-settings-page.tsx`: Add ConfirmDialog before visibility/accessLevel mutation; cancel reverts selector
- [x] 16-B.2a — `server/src/workspaces/`: Add `GET /public/:slug/boards/:boardSlug` — router + controller + service
- [x] 16-B.2b — `shared/contracts/schemas.ts`: Add `PublicBoardDetailDTOSchema` (board metadata + paginated posts)
- [x] 16-B.2c — `web/src/api/public.ts` + `use-public-workspaces.ts` + `query-keys.ts`: Wire `getBoardBySlug()`, `usePublicBoard()`
- [x] 16-B.2d — `web/src/core/router.tsx`: Add `/explore/:slug/:boardSlug` → `PublicBoardView`
- [x] 16-B.2e — `web/src/public/public-board-view.tsx`: Create component — board metadata + paginated posts + 404 back-link
- [x] 16-B.3 — `web/src/boards/components/sidebar.tsx`: Add "Explore" link → `/explore`
- [x] 16-B.4a — `web/src/auth/mobile-header.tsx` → `web/src/auth/top-navbar.tsx`: Rename, remove `lg:hidden`, add settings/profile/logout right side
- [x] 16-B.4b — `web/src/auth/authenticated-layout.tsx`: Swap MobileHeader for TopNavbar; delete old file

## 16-C: Growth Features (schema migration)

- [ ] 16-C.1 — `server/prisma/schema.prisma`: Add `emailVerified Boolean @default(false)` on User; add `VerificationToken` model (userId, token unique, expiresAt, cascade delete)
- [ ] 16-C.2 — Run `pnpm run prisma:migrate` for new schema
- [ ] 16-C.3 — `shared/contracts/schemas.ts`: Add `emailVerified` to `AuthUserSchema`
- [ ] 16-C.4 — `server/src/auth/auth.service.ts`: Add `generateVerificationToken()`, `verifyEmail()`, `resendVerification()` — crypto.randomUUID, 24h expiry, Resend
- [ ] 16-C.5 — `server/src/auth/auth.controller.ts`: Add verifyEmail + resendVerification handlers
- [ ] 16-C.6 — `server/src/auth/auth.router.ts`: Wire `GET /verify-email/:token` + `POST /resend-verification`
- [ ] 16-C.7 — `server/src/email/email.service.ts`: Add `sendVerificationEmail(token, email)` method
- [ ] 16-C.8 — `server/src/email/templates/verification.ts`: Email template with token link + 24h expiry notice
- [ ] 16-C.9 — `server/src/workspaces/workspaces.service.ts`: Limit check in `create()` — 1 for unverified, 20 for verified
- [ ] 16-C.10 — `server/prisma/seed.ts`: Add "Bienvenido" workspace (PUBLIC/INTERACT, owner ezefernandezyf@gmail.com)
- [ ] 16-C.11 — `web/src/user/settings-page.tsx`: Add verification badge section — ✓ "Verified" or ⚠ "Unverified" + resend CTA → toast
- [ ] 16-C.12 — `web/src/auth/auth-store.ts`: Include `emailVerified` in `patchUser`

## Testing

- [ ] T.1 — Unit: Public board service — valid slug, private workspace, 404
- [ ] T.2 — Unit: Verification token — generate, verify, expired token
- [ ] T.3 — Unit: Workspace limit — unverified blocked at 1, verified allowed at 20
- [ ] T.4 — Unit: PublicRoute guard — redirects `/login`, allows `/` and `/explore`
- [ ] T.5 — Integration: Public board endpoint via supertest
- [ ] T.6 — Run all tests: `pnpm --filter @echolog/server run test` + `pnpm --filter @echolog/web run test`
