# Design: Phase 16 — Polish & Growth

## Technical Approach

Three delivery groups ordered by risk: **16-A** (4 single-file fixes, no schema), **16-B** (new routes + components, no schema), **16-C** (Prisma migration + Resend template + seed). Each group is independently deployable.

---

## Architecture Decisions

### AD-1: Public board detail endpoint
| Option | Tradeoff |
|--------|----------|
| `GET /api/workspaces/public/:slug/boards/:boardSlug` | Follows existing pattern, simpler routing reuse |
| `GET /api/public/workspaces/:slug/boards/:boardSlug` | Matches spec literal, new route prefix |
| **Decision**: Use existing `/workspaces/public/:slug/boards/:boardSlug` | Consistency wins — no new router prefix |

### AD-2: TopNavbar as extended MobileHeader
| Option | Tradeoff |
|--------|----------|
| Extend MobileHeader to all breakpoints + add right-side items | Single component, sidebar settings/logout becomes redundant |
| Add separate TopNavbar for desktop | Duplicated structure, two headers to maintain |
| **Decision**: Extend MobileHeader → rename to `TopNavbar` | Remove `lg:hidden`, add settings/profile/logout right, remove from sidebar bottom |

### AD-3: PublicRoute guard — location-based whitelist
| Option | Tradeoff |
|--------|----------|
| `useLocation()` + whitelist `['/login', '/register']` trigger redirect | Clear intent, cheap |
| Check against a route list | Over-engineering for 2 routes |
| **Decision**: Location whitelist | Uses existing `useLocation` from react-router-dom |

### AD-4: Verification token model
| Option | Tradeoff |
|--------|----------|
| Separate `VerificationToken` model | Cleaner TTL, independent lifecycle |
| Add columns to `User` | Token lifecycle tracking requires separate fields anyway |
| **Decision**: New model | Follows invitation token pattern (`crypto.randomUUID`, expiresAt, unique index) |

### AD-5: Delivery strategy
Vast majority of changes are sub-100-line modifications. Public board detail (~200 lines front+back) is the largest single unit. Works within the 400-line PR budget. Single PR recommended.

---

## Data Flow

### Public board detail
```
Visitor → /explore/:slug/:boardSlug
  → PublicBoardView component
    → publicApi.getBoardBySlug(slug, boardSlug)
      → GET /api/workspaces/public/:slug/boards/:boardSlug
        → workspacesService.getPublicBoardBySlug()
          → prisma.workspace.findFirst({where:{slug, visibility:'PUBLIC'}, include:{boards:{where:{slug:boardSlug}, include:{posts:{orderBy, take}, _count:{select:{posts:true}}}}}})
```

### Email verification flow
```
Register → authService.register()
  → generateToken (crypto.randomUUID, 24h expiry)
  → save VerificationToken {userId, token, expiresAt}
  → emailService.sendVerificationEmail(token, email)
  → User clicks link → GET /api/auth/verify-email/:token
    → authService.verifyEmail(token) → set emailVerified=true, delete token
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modify | Add `emailVerified Boolean @default(false)` on User; add `VerificationToken` model |
| `server/prisma/seed.ts` | Modify | Add "Bienvenido" workspace (PUBLIC, INTERACT, ezefernandezyf@gmail.com) |
| `server/src/auth/auth.router.ts` | Modify | Add `GET /verify-email/:token`, `POST /resend-verification` |
| `server/src/auth/auth.controller.ts` | Modify | Add `verifyEmail`, `resendVerification` handlers |
| `server/src/auth/auth.service.ts` | Modify | Add `verifyEmail`, `resendVerification`, `generateVerificationToken` methods |
| `server/src/workspaces/workspaces.service.ts` | Modify | Add workspace creation limit check (1 unverified / 20 verified) |
| `server/src/workspaces/workspaces.controller.ts` | Modify | Add `getPublicBoardBySlug` handler |
| `server/src/workspaces/workspaces.router.ts` | Modify | Add `GET /public/:slug/boards/:boardSlug` |
| `server/src/email/email.service.ts` | Modify | Add `sendVerificationEmail()` method |
| `server/src/email/templates/` | Create | Add `verification.ts` email template |
| `shared/contracts/schemas.ts` | Modify | Add `emailVerified` to AuthUserSchema; add `PublicBoardDetailDTO` schema |
| `web/src/hooks/use-auth.ts` | Modify | Remove `queryClient.clear()` from error handler (16-A) |
| `web/src/auth/auth-guard.tsx` | Modify | Location-based PublicRoute whitelist (16-A) |
| `web/src/shared/components/landing-page.tsx` | Modify | CTA `/login` → `/explore` (16-A), em dash cleanup (16-A) |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modify | Add ConfirmDialog before visibility/accessLevel mutation (16-B) |
| `web/src/core/router.tsx` | Modify | Add `/explore/:slug/:boardSlug` route (16-B) |
| `web/src/public/public-layout.tsx` | Modify | Remove `lg:hidden`, rename to TopNavbar, add right-side items (16-B) |
| `web/src/auth/mobile-header.tsx` | Delete | Merged into TopNavbar (16-B) |
| `web/src/auth/authenticated-layout.tsx` | Modify | Replace MobileHeader with TopNavbar (16-B) |
| `web/src/boards/components/sidebar.tsx` | Modify | Add Explore link; remove settings/logout (now in TopNavbar) (16-B) |
| `web/src/public/public-board-view.tsx` | Create | New board detail component (16-B) |
| `web/src/api/public.ts` | Modify | Add `getBoardBySlug()` (16-B) |
| `web/src/hooks/use-public-workspaces.ts` | Modify | Add `usePublicBoard()` query hook (16-B) |
| `web/src/hooks/query-keys.ts` | Modify | Add `public.boardDetail()` (16-B) |
| `web/src/user/settings-page.tsx` | Modify | Add verification badge + resend CTA section (16-C) |
| `web/src/auth/auth-store.ts` | Modify | Patch user includes `emailVerified` (16-C) |

---

## Interfaces / Contracts

```typescript
// ── User schema update ──
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
});

// ── New public board detail DTO ──
export const PublicBoardDetailDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  postCount: z.number(),
  posts: z.array(PublicPostDTO),
  nextCursor: z.string().nullable(),
});

// ── VerificationToken model (Prisma) ──
model VerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([token])
}
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Public board service — valid slug, private workspace, not found | Vitest, mock prisma |
| Unit | Verification token — generate, verify, expired | Vitest |
| Unit | Workspace limit — unverified blocked at 1, verified at 20 | Vitest |
| Unit | PublicRoute guard — redirects /login, allows / and /explore | Vitest + RTL |
| Integration | Public board endpoint — full request/response | Supertest |
| E2E | Verify email link flow (if Resend mock available) | Playwright |

## Migration / Rollout

No backfill for `emailVerified` — existing users stay `false` (unverified). Additive column with default. `VerificationToken` table created fresh. Rollback plan per proposal: revert commit groups independently.

## Open Questions

None.
