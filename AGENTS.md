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
- Conventional Commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `test(scope):`
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

### Phase 7: Deploy 🔲
- 7.1 Neon.tech PostgreSQL database
- 7.2 Backend deploy (Render/Railway)
- 7.3 Frontend deploy (Vercel)
- 7.4 CI/CD pipeline ✅ (GitHub Actions: lint, type-check, test on PR + push to main)
- 7.5 README with setup, architecture, and deploy instructions

### Phase 8: User Features ✅
- [x] 8.1 Comment deletion ✅ — service + controller + router + UI with authorization (own comments + workspace owner)
- [x] 8.2 Better login page ✅ — branded card layout with logo, centered form, dark mode
- [x] 8.3 User settings page ✅ — `/settings` with profile name, email change, password change (3 endpoints, Zod validation)

### Phase 9: Growth Features (post-deploy) 🔲
- [ ] 9.1 Email verification — emailVerification model field + email service + verify flow + optional middleware
- [ ] 9.2 Public workspace discovery — visibility enum + public feed + popularity ranking + invite/approval system
