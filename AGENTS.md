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

### Phase 11: Visual Redesign (v1.1) ✅
> Applied portfolio-personality design system — Indigo + Coral palette, Clash Display + Satoshi fonts, OKLCH tokens, WCAG 2.2 AA, 40+ files migrated from Zinc defaults.

- [x] 11.1 **Design system foundation** ✅ — OKLCH color tokens (indigo primary, coral accent, warm gray surface), typography scale (Clash Display + Satoshi + Geist Mono), shadow elevation system (xs-2xl), radius scale, cn.ts with clsx+twMerge
- [x] 11.2 **Component library redesign** ✅ — buttons (press-down scale, primary/90 hover), cards (hover lift + shadow-md), inputs (primary focus ring), modals (backdrop blur + scale-in), badges (semantic variants), skeletons (shimmer animation)
- [x] 11.3 **Layout & navigation redesign** ✅ — sidebar (primary accent bar on active board, smooth width transition, hover shadows), board/workspace components (52+ Zinc→token replacements, 30+ dark: overrides deleted)
- [x] 11.4 **Landing & auth pages redesign** ✅ — hero (8xl Clash Display, indigo→coral gradient text, accent CTA with hover lift), features grid (stagger animation, icon containers, card hover effects), tagline rewrite
- [x] 11.5 **Micro-interactions & animations** ✅ — vote button pulse, skeleton shimmer, card hover lift, modal backdrop blur, sidebar width transition, toaster spring physics, feature grid stagger, all reduced-motion aware
- [x] 11.6 **WCAG 2.2 AA accessibility upgrade** ✅ — 2.4.7 Focus Appearance (PASS), 2.5.8 Target Size (PASS, 2 fixes), 3.3.7 Accessible Authentication (PASS), 3.3.8 Redundant Entry (PASS), 3.2.6 Consistent Help (N/A)
- [x] 11.7 **Design system documentation** ✅ — DESIGN-TOKENS.md with complete token reference, typography scale, color palette, shadow system, animation utilities, anti-patterns

### Phase 12: Architecture Hardening (v1.1) ✅
> Full SDD cycle: explore → propose → spec → design → tasks → apply → verify → archive. 139 tests, 0 lint errors.

- [x] 12.1 **Shared Zod schemas** — migrated all 175 TS interfaces to 34 Zod schemas with `z.infer<typeof schema>` in `shared/contracts/`, deleted `dtos.ts`, single source of truth for frontend + backend
- [x] 12.2 **Split api-client.ts into domain modules** — 9 domain API modules under `web/src/api/`, 10 React Query hooks under `web/src/hooks/` with centralized query key factory, 22+ components migrated, `api-client.ts` deleted
- [x] 12.3 **Refactor authenticated-layout.tsx** — split into `SidebarContainer` (fetches workspaces/boards internally + loading/error/empty states), `MobileHeader` (hamburger + branding + theme toggle), and `AuthenticatedLayout` (pure composition, 227→70 lines)

### Phase 13: Production Hardening (v1.1) ✅
> TDD: 3 ciclos (RED→GREEN→REFACTOR). 226 tests, 0 lint errors, 0 console.* en server/src/. Encontrados y corregidos 2 bugs pre-existentes.

- [x] 13.1 **Rate limiting** — `express-rate-limit` en auth (5/15min), invitations (20/15min), votes (30/1min). Skip en test env. Respuesta 429 con `Retry-After` header.
- [x] 13.2 **Structured logging** — `pino` con redact de datos sensibles, `request-id` middleware con `X-Request-Id`, cero `console.*` en server/src/
- [x] 13.3 **Expand test coverage** — 80 tests nuevos (42 unit tests de `workspaces.service.ts` + 38 UI tests de members/invitations/settings). Total: 226 tests.

### Phase 13.5: Security Hardening ✅
> CSP explícita, sanitización server-side con sanitize-html, ESLint anti-rawSQL, 16 tests de seguridad. 137 tests totales server.

- [x] 13.5.1 **CSP & Security Headers** — helmet con CSP explícita (`default-src 'self'`, `font-src` Google Fonts, `frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [x] 13.5.2 **Server-side input sanitization** — `sanitizeInput()` con `sanitize-html` en 9 campos de 5 services (posts, comments, boards, workspaces, auth). HTML stripping total.
- [x] 13.5.3 **Output encoding audit** — JSDoc en DTOs de `shared/contracts` marcando campos user-generated como plain text. React escapa JSX por defecto.
- [x] 13.5.4 **SQL injection hardening** — ESLint `no-restricted-syntax` para `$queryRawUnsafe`. Cero raw SQL en codebase.

### Phase 14: Email Service (v1.1) ✅
- [x] 14.1 **Email provider integration** (Resend) — transactional email client with templating, delivery status tracking, graceful failure fallback
- [x] 14.2 **Email templates** — invitation email with token link + workspace name, welcome email on registration or first workspace creation
- [x] 14.3 **Wire email into invitation flow** — send invitation email when invite is created, notify on role changes, handle delivery failures with user-visible errors

### Phase 15: Public Workspaces & Discovery (v1.1) ✅
- [x] 15.1 **Workspace visibility enum** — `PUBLIC | PRIVATE` field on Workspace model, only owner can change
- [x] 15.2 **Public access levels** — owner-configurable: `FULL` (view + vote + comment + create boards), `INTERACT` (view + vote + comment), `READ_ONLY` (view only)
- [x] 15.3 **Public workspace lobby** — discoverable public workspace feed (popular/recent), accessible without login
- [x] 15.4 **"Continue without account"** — option on landing page that shows public workspace lobby with limited interactions based on access level
- [x] 15.5 **Public workspace API** — public endpoints for listing and viewing workspace content without auth, with membership middleware bypass for public workspaces

### Phase 16: Polish & Growth (v1.2) ✅ — en `develop`
> SDD completo. 31 tareas, 376 tests. Revertido de main a pedido del usuario; iterando en develop.
- [x] **16-A Quick Wins** — F5 blank page, CTA → /explore, PublicRoute whitelist, em dashes
- [x] **16-B UX Upgrades** — ConfirmDialog visibilidad, public board detail, Explore en sidebar, TopNavbar
- [x] **16-C Growth Features** — email verification, workspace limits, seed "Bienvenido", verification badge

### Phase 16-D: Polish Iteration ✅
> Correcciones y mejoras sobre lo mergeado en develop. Bugs + UX pendientes de Phase 16.
- [x] 16-D.1 **Fix navegación a boards públicos** — BoardCard ahora linkea a `/explore/:slug/:boardSlug`.
- [x] 16-D.2 **Votar, postear y comentar en boards públicos** — PublicPostRow con controles gateados por accessLevel (READ_ONLY/INTERACT/FULL).
- [x] 16-D.3 **Posts nuevos no se refrescan automáticamente** — query invalidation fixeada con prefijo `['posts', boardId]`.
- [x] 16-D.4 **Botón hamburguesa** — agregado `lg:hidden`: visible solo en mobile, sidebar siempre visible en desktop.
- [x] 16-D.5 **Eliminar "Continue without account" del homepage** — solo queda "See how it works" → /explore como Link.
- [x] 16-D.6 **Mover notificaciones, theme toggle y perfil a la TopNavbar** — avatar dropdown (Settings/Sign out) + PendingInvitationsBell + ThemeToggle. Sidebar sin sección inferior.
- [x] 16-D.7 **Link Explore solo en dashboard** — condicional: solo visible en `/w`, oculto dentro de un workspace.

### Phase 17: Workspace Permissions & Board Approval 🔲
> Sistema de permisos granulares por workspace + flujo de aprobación de boards.
- [ ] 17.1 **Solicitud de creación de boards** — miembros solicitan crear board; admin/owner aprueba o rechaza. Configurable por workspace: creación libre, con aprobación, o solo admins/owner.
- [ ] 17.2 **Permisos granulares por workspace** — owner configura por workspace: quién crea boards, quién borra, quién comenta (owner, admins, members, nobody).
- [ ] 17.3 **Owner define si admins pueden cambiar configuraciones** — el owner decide si los admins tienen permiso para modificar settings del workspace o solo él.
- [ ] 17.4 **Admins y owners borran posts/comentarios/boards de cualquiera** — autorización para borrar contenido ajeno dentro del workspace. (Movido de 16-D.8)
