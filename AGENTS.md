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

### Phase 3: UI/UX Polish 🔲
- 3.1 Responsive design
- 3.2 Dark mode
- 3.3 Loading skeletons
- 3.4 Toast notifications
- 3.5 Animations (votes + transitions)
- 3.6 Landing page
- 3.7 Post detail view
- 3.8 Login responsive

### Phase 4: Admin & Advanced 🔲
- 4.1 Admin middleware
- 4.2 Workspace settings
- 4.3 Destructive confirmations
- 4.4 Advanced filters
- 4.5 Pagination

### Phase 5: Deploy 🔲
- 5.1 Neon.tech database
- 5.2 Backend (Render)
- 5.3 Frontend (Vercel)
- 5.4 README

### Phase 6: Testing 🔲
- 6.1 More frontend tests (currently 25)
- 6.2 E2E tests
