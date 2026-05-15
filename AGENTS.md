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
- ESLint + Prettier run on every change: `npm run lint` / `npm run format`

## Git Workflow (STRICT — zero exceptions)
1. **Feature branches**: EVERY task starts on a new branch from `main`
2. **Branch naming**: `feat/short-name`, `fix/short-name`, `chore/short-name`
3. **Atomic commits**: one logical change layer per commit, conventional format
4. **Push + PR + Merge**: push branch, create PR, merge to `main` — never commit directly to `main`
5. **Clean working tree**: no untracked files, no WIP before PR
6. **Lint before push**: `npm run lint && npm run format` must pass
7. **Tests before merge**: `npm test` (server + web) must pass — 75 tests minimum

## How to Run
```bash
npm install              # root
cd server && npm install # server deps
cd web && npm install    # web deps
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate   # run migrations
npm run prisma:seed      # seed demo data (demo@echolog.dev / password123)
npm run dev:server       # terminal 1: backend on :3000
npm run dev:web          # terminal 2: frontend on :5173
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

### Phase 5: QA & Polish 🟡
- 5.1 Form validation edge cases ✅ — 8/8 spec requirements, 20/20 tasks, 75 tests passing
- 5.2 Accessibility audit 🟡 (P0 ✅: skip link, form errors, input labels, live regions, reduced-motion, color-scheme — P1-P3 pending)
- 5.3 Loading/empty/error states audit 🟡 (most views covered, audit in progress)
- 5.4 Mobile UX pass 🟡 (touch targets, viewport meta, safe areas)

### Phase 5.5: Quick Polish ✅
- [x] 5.5.1 Fix board form validation — custom Zod messages + remove `shouldValidate`
- [x] 5.5.2 Fix hamburger overlap — mobile padding so it doesn't cover "EchoLog Board" text
- [x] 5.5.3 Fix sidebar auto-open on mobile — initialize `sidebarOpen` based on viewport width
- [x] 5.5.4 Fix ThemeToggle overlap with submit feedback — adjust header padding/z-index
- [x] 5.5.5 Add sign out confirmation dialog using existing ConfirmDialog component
- [x] 5.5.6 Add workspace settings navigation link in sidebar → ✅ DONE (sidebar.tsx now has Settings link below workspace name)

### Phase 6: Testing 🔲
- 6.1 Server tests: auth, comments, votes, workspace CRUD, post filters, isolation (14 tests)
- 6.2 Web tests: auth bootstrap, vote optimistic rollback, workspace navigation (25 tests)
- 6.3 E2E tests: auth flow, workspace→board→post→vote→comment happy path

### Phase 7: Deploy 🔲
- 7.1 Neon.tech PostgreSQL database
- 7.2 Backend deploy (Render/Railway)
- 7.3 Frontend deploy (Vercel)
- 7.4 CI/CD pipeline ✅ (GitHub Actions: lint, type-check, test on PR + push to main)
- 7.5 README with setup, architecture, and deploy instructions

### Phase 8: User Features 🔲
- [ ] 8.1 Comment deletion — service + controller + router + UI with authorization (own comments + workspace owner)
- [ ] 8.2 Better login page — split layout with landing preview, or inline form with hero
- [ ] 8.3 User settings page — change username, email, password with proper validation

### Phase 9: Growth Features (post-deploy) 🔲
- [ ] 9.1 Email verification — emailVerification model field + email service + verify flow + optional middleware
- [ ] 9.2 Public workspace discovery — visibility enum + public feed + popularity ranking + invite/approval system
