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
- Conventional Commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`
- React 19: no useMemo/useCallback (compiler handles it), named imports only
- TypeScript: strict mode, never `any`, `as const` pattern for string literals
- Never build after changes, never add "Co-Authored-By" to commits
- ESLint + Prettier run on every change: `npm run lint` / `npm run format`

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

## Roadmap (current)
- ✅ Phase 1: Backend scaffold, Prisma schema, domain services
- ✅ Phase 2: Frontend scaffold, auth, workspace/board/post views
- ✅ Phase 1.1: Prisma wired to all services (in-memory→SQLite)
- 🔲 Phase 1.2–1.5: bcrypt ✅, Zod middleware, error handler, CORS/helmet
- 🔲 Phase 2: Votes with Optimistic UI, comments, filters, React Hook Form
- 🔲 Phase 3: Responsive, dark mode, skeletons, toasts, animations
- 🔲 Phase 4: Admin middleware, settings page, destructive confirmations
- 🔲 Phase 5: Deploy (Neon.tech, Render, Vercel)
- 🔲 Phase 6: Frontend + E2E tests
