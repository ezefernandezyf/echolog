# EchoLog — Agent Context

> Multi-tenant customer feedback SaaS. Think Canny.io alternative.

## Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind 4 + React Router 7
- **Backend**: Node.js + Express + TypeScript + Prisma (SQLite dev, Postgres prod)
- **State**: React Query (server) + Zustand (UI)
- **Auth**: JWT in httpOnly cookies (no localStorage)
- **Validation**: Zod (shared contracts in `shared/contracts/`)
- **Testing**: Vitest (server), Vitest + React Testing Library (web TBD)
- **Lint/Format**: ESLint 9 flat config + Prettier
- **Package Manager**: pnpm (workspace monorepo via `pnpm-workspace.yaml`)

## Architecture
- **Full Screaming Architecture**: business domains are top-level folders in `server/src/`
- **Monorepo**: `server/`, `web/`, `shared/` — each has its own `package.json` with `"type": "module"`
- **API**: REST JSON under `/api/*`, Express routers with controller-service-prisma layers
- **Database**: Prisma with composite keys for tenant isolation (`@@unique([workspaceId, slug])`)

## Conventions
- Conventional Commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `test(scope):` — **título en inglés, descripción en español**
- React 19: no useMemo/useCallback (compiler handles it), named imports only
- TypeScript: strict mode, never `any`, `as const` pattern for string literals
- Never build after changes, never add "Co-Authored-By" to commits
- ESLint + Prettier run on every change: `pnpm run lint` / `pnpm run format`

## Git Workflow (STRICT — zero exceptions)
1. **Feature branches**: EVERY task starts on a new branch from `main`
2. **Branch naming**: `feat/short-name`, `fix/short-name`, `chore/short-name`
3. **Atomic commits**: one logical change layer per commit, conventional format
4. **Push + PR + Merge**: push branch, create PR, merge to `main` — never commit directly to `main`
5. **Clean working tree**: no untracked files, no WIP before PR
6. **Lint before push**: `pnpm run lint && pnpm run format` must pass
7. **Tests before merge**: `pnpm test` (server + web) must pass — 75 tests minimum

## How to Run
```bash
pnpm install              # installs all workspace deps (root + server + web + shared)
pnpm run prisma:generate  # generate Prisma client
pnpm run prisma:migrate   # run migrations
pnpm run prisma:seed      # seed demo data (demo@echolog.dev / password123)
pnpm run dev:server       # terminal 1: backend on :3000
pnpm run dev:web          # terminal 2: frontend on :5173
```

## Key Files
- `server/prisma/schema.prisma` — data model
- `server/src/infra/app.ts` — Express app + route wiring
- `server/src/infra/prisma.ts` — Prisma singleton
- `server/src/auth/auth.middleware.ts` — JWT cookie → req.userId
- `shared/contracts/` — Zod schemas + DTOs shared front/back
- `web/src/core/api-client.ts` — Axios instance + API functions
- `web/src/core/router.tsx` — React Router config
- `web/vite.config.ts` — Vite + Tailwind plugin + API proxy to :3000

## Roadmap

### Phase 1: Foundation ✅
- 1.1 Prisma wired to services
- 1.2 bcrypt
- 1.3 Zod middleware
- 1.4 Error handler global
- 1.5 CORS + helmet

### Phase 2: Core Features ✅
- 2.1 Optimistic UI votes
- 2.2 Vote contract (POST/DELETE + 409)
- 2.3 Admin post status controls
- 2.4 Post status enum in Prisma
- 2.5 Comments system
- 2.6 Debounced search
- 2.7 React Hook Form + Zod validation

### Phase 3: UI/UX Polish ✅
- 3.1 Responsive design (mobile sidebar drawer, workspace grid, touch targets)
- 3.2 Dark mode (theme store, toggle, system preference detection, all components)
- 3.3 Loading skeletons (posts, boards, workspaces, session)
- 3.4 Toast notifications (sonner success on login, register, logout, create mutations)
- 3.5 Animations (CSS keyframes: fade-in, slide-up, vote pulse, flip)
- 3.6 Landing page (public hero, features grid, CTA)
- 3.7 Post detail view (server endpoint + frontend page with comment extraction)
- 3.8 Login responsive (touch-friendly auth forms)

### Phase 4: Admin & Advanced ✅
- 4.1 Admin middleware ✅ (requireWorkspaceAdmin wired to post status endpoint)
- 4.2 Workspace settings ✅ (edit name/slug, delete with typed confirmation; sidebar nav link added recently)
- 4.3 Destructive confirmations ✅ (typing-based confirm dialog for workspace/board delete)
- 4.4 Advanced filters ✅ (status pills, Trending/Top/New sort, cursor pagination, load-more)
- 4.5 Board settings ✅ (edit name/slug/description, delete with typed confirmation)

### Phase 5: QA & Polish ✅
- 5.1 Form validation edge cases ✅ — 8/8 spec requirements, 20/20 tasks, 75 tests passing
- 5.2 Accessibility audit ✅ (P0 ✅: skip link, form errors, input labels, live regions, reduced-motion, color-scheme; P1 ✅: landmarks, aria-pressed, dialog naming, focus management, heading hierarchy; P2 ✅: status badge labels, dynamic page titles, mobile sidebar focus trap, breadcrumb semantics, interactive element audit; P3 ✅: decorative icon sr-only text, keyboard shortcut hints, font preload, color-scheme meta — WCAG 2.1 AA complete, 20/20 tasks)
- 5.3 Loading/empty/error states audit ✅ (ErrorAlert component, comment error+retry, sidebar error fallback, board flash prevention, auth form error UX)
- 5.4 Mobile UX pass ✅ (Batch 1 ✅: safe areas, toast positioning, touch targets 44px, font sizing 16px, bottom-sheet modals — PR #39. Batch 2 ✅: list virtualization with @tanstack/react-virtual — PR #41)

### Phase 5.5: Quick Polish ✅
- [x] 5.5.1 Fix board form validation — custom Zod messages + remove `shouldValidate`
- [x] 5.5.2 Fix hamburger overlap — mobile padding so it doesn't cover "EchoLog Board" text
- [x] 5.5.3 Fix sidebar auto-open on mobile — initialize `sidebarOpen` based on viewport width
- [x] 5.5.4 Fix ThemeToggle overlap with submit feedback — adjust header padding/z-index
- [x] 5.5.5 Add sign out confirmation dialog using existing ConfirmDialog component
- [x] 5.5.6 Add workspace settings navigation link in sidebar → ✅ DONE (sidebar.tsx now has Settings link below workspace name)

### Phase 6: Testing ✅
- 6.1 Server tests ✅: auth, comments, votes, workspace CRUD, post filters, isolation (29 tests, 11 files)
- 6.2 Web tests ✅: auth bootstrap, vote optimistic rollback, workspace navigation (46 tests, 5 files)
- 6.3 E2E tests ✅: Playwright infra (`@echolog/e2e`), ephemeral SQLite per run, auth smoke (login + logout), navigation smoke (workspace→board), basic smoke (/login loads) — 4/4 passing, `pnpm test:e2e` (PR #42)
- 6.4 Test fix ✅: auth-bootstrap.test.tsx now exercises API error path (valid email, not Zod validation)
- 6.5 Vitest 4 compat fix: explicit `expect.extend(matchers)` for `@testing-library/jest-dom` (PR #43)

### Phase 7: User Features ✅
- [x] 7.1 Comment deletion ✅ — service + controller + router + UI with authorization (own comments + workspace owner)
- [x] 7.2 Better login page ✅ — branded card layout with logo, centered form, dark mode
- [x] 7.3 User settings page ✅ — `/settings` with profile name, email change, password change (3 endpoints, Zod validation)

### Phase 8: Workspace Members & Roles ✅
- [x] 8.1 Add VIEWER role + enforce permissions by role (read-only, member, admin, owner)
- [x] 8.2 Membership middleware — protect all workspace-scoped endpoints
- [x] 8.3 Invitation system — model + endpoints (create, accept, decline)
- [x] 8.4 Members UI — list, change role, remove member
- [x] 8.5 Invitation UI — invite form + accept page
- [x] 8.6 Pending invitations bell — endpoint + bell icon with badge + dropdown to accept/decline

### Phase 9: In-App Notifications ✅
- [x] 9.1 Notification model ✅ — Prisma schema with NotificationType enum (INVITE_SENT, ROLE_CHANGED, NEW_COMMENT), user/workspace/actor relations, read status, timestamps
- [x] 9.2 Create notifications automatically ✅ — wired into invite send, role change, and comment creation service methods
- [x] 9.3 Notification bell with unread badge ✅ — sidebar bell icon with badge count + dropdown (read/unread states, action buttons)
- [x] 9.4 Mark as read + notification history page ✅ — `/notifications` page with full history, mark-read button, unread count endpoint

### Phase 10: Deploy ✅
- [x] 10.1 Neon.tech PostgreSQL database ✅ — production database with connection pooling
- [x] 10.2 Backend deploy ✅ — Fly.io with Dockerfile, health check, auto-deploy on push to main
- [x] 10.3 Frontend deploy ✅ — Vercel with API proxy rewrites, custom build command
- [x] 10.4 CI/CD pipeline ✅ — GitHub Actions: lint, type-check, test on PR + push to main
- [x] 10.5 README ✅ — comprehensive docs with local dev, deploy, and architecture sections

### Phase 11: Visual Redesign (v1.1) 🔲
> Applying `portfolio-personality` design system for distinctive visual identity — breaking free from generic SaaS "distributional convergence".

- [ ] 11.1 **Design system foundation** — color tokens (primary, accent, surface, semantic), typography scale (brand + UI fonts), spacing/sizing tokens, shadow/elevation system, border-radius scale, transition durations
- [ ] 11.2 **Component library redesign** — buttons (primary/secondary/ghost/destructive with hover states), cards (surface elevation, interactive states), inputs (focus rings, validation states), modals (backdrop blur, enter/exit animations), badges (status colors, dot variants), skeletons (shimmer animation)
- [ ] 11.3 **Layout & navigation redesign** — sidebar (collapsed/expanded states, brand mark, active indicators), mobile header (bottom sheet nav, gesture-friendly), authenticated shell (consistent spacing, breadcrumbs), workspace hub (card grid with hover effects)
- [ ] 11.4 **Landing & auth pages redesign** — hero section (gradient, illustration, CTA hierarchy), features grid (icon + description cards), login/register (branded card, social proof, dark mode polish)
- [ ] 11.5 **Micro-interactions & animations** — vote button pulse/confetti, toast enter/exit (spring physics), modal open/close (scale + fade), sidebar expand/collapse (smooth width), page transitions, loading shimmer, card hover lift
- [ ] 11.6 **WCAG 2.2 AA accessibility upgrade** — focus-visible indicators (2.4.7), target size 24px minimum (2.5.8), consistent help placement (3.2.6), accessible authentication (3.3.7), redundant entry (3.3.7), reduced motion alternatives for all animations
- [ ] 11.7 **Design system documentation** — component catalog with usage guidelines, token reference, accessibility annotations, responsive behavior docs

### Phase 12: Architecture Hardening (v1.1) 🔲
- [ ] 12.1 **Shared Zod schemas** — migrate DTOs from TS interfaces to Zod schemas in `shared/contracts/`, derive types via `z.infer<typeof schema>`, single source of truth for frontend form validation + backend request validation
- [ ] 12.2 **Split api-client.ts into domain modules** — `api/workspaces.ts`, `api/boards.ts`, `api/auth.ts`, `api/invitations.ts`, `api/notifications.ts` + create React Query data hooks layer (`useCancelInvitation`, `useCreateBoard`, etc.) so components never call the API client directly
- [ ] 12.3 **Refactor authenticated-layout.tsx** — split into `SidebarContainer` (workspace/board queries + loading/error states), `MobileHeader` (hamburger + branding), and `AuthenticatedLayout` (orchestration only)

### Phase 13: Production Hardening (v1.1) 🔲
- [ ] 13.1 **Rate limiting** — `express-rate-limit` on auth (login/register brute-force), invitations (spam), votes (abuse); different limits per route
- [ ] 13.2 **Structured logging** — replace `console.log/error` with `pino`, add request ID middleware for tracing, proper log levels (info/warn/error), error serialization with stack traces
- [ ] 13.3 **Expand test coverage** — direct service unit tests for `workspaces.service.ts` (create/update/delete/members/invitations), UI component tests for invitations/members/settings flows, error/edge case coverage for all mutations

### Phase 14: Email Service (v1.1) 🔲
- [ ] 14.1 **Email provider integration** (Resend) — transactional email client with templating, delivery status tracking, graceful failure fallback
- [ ] 14.2 **Email templates** — invitation email with token link + workspace name, welcome email on registration or first workspace creation
- [ ] 14.3 **Wire email into invitation flow** — send invitation email when invite is created, notify on role changes, handle delivery failures with user-visible errors

### Phase 15: Public Workspaces & Discovery (v1.1) 🔲
- [ ] 15.1 **Workspace visibility enum** — `PUBLIC | PRIVATE` field on Workspace model, only owner can change
- [ ] 15.2 **Public access levels** — owner-configurable: `FULL` (view + vote + comment + create boards), `INTERACT` (view + vote + comment), `READ_ONLY` (view only)
- [ ] 15.3 **Public workspace lobby** — discoverable public workspace feed (popular/recent), accessible without login
- [ ] 15.4 **"Continue without account"** — option on landing page that shows public workspace lobby with limited interactions based on access level
- [ ] 15.5 **Public workspace API** — public endpoints for listing and viewing workspace content without auth, with membership middleware bypass for public workspaces

### Phase 16: Growth Features (post-v1.1) 🔲
- [ ] 16.1 Email verification — emailVerification model field + email service + verify flow + optional middleware
- [ ] 16.2 Public workspace popularity ranking — trending/sort by votes, comments, activity
- [ ] 16.3 Invite/approval system for private workspaces
