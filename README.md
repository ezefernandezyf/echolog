# EchoLog

Multi-tenant customer feedback SaaS. Think Canny.io alternative.

Collect, organize, and act on user feedback. Boards, upvoting, comments, and workspace management.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | JWT in httpOnly cookies |
| State | React Query (server) + Zustand (UI) |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| E2E | Playwright |
| Deploy | Vercel (frontend), Render (backend), Neon (DB) |

---

## Architecture

Monorepo managed with pnpm workspaces. The backend follows screaming architecture — business domains are top-level folders inside `server/src/`.

```
echolog/
├── server/          # Express API (port 3000)
│   ├── prisma/      # Schema + migrations
│   └── src/
│       ├── auth/
│       ├── boards/
│       ├── comments/
│       ├── infra/   # Express app, Prisma client, HTTP utils
│       ├── invitations/
│       ├── notifications/
│       ├── posts/
│       ├── votes/
│       └── workspaces/
├── shared/          # Shared contracts (Zod schemas + DTOs)
├── web/             # Vite + React SPA (port 5173)
└── e2e/             # Playwright tests
```

---

## Quick Start (local dev)

```bash
git clone https://github.com/ezefernandezyf/echolog.git
cd echolog
pnpm install
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed  # creates demo user: demo@echolog.dev / password123
pnpm run dev:server   # terminal 1: backend on :3000
pnpm run dev:web      # terminal 2: frontend on :5173
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens | `dev-secret-change-in-production` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `NODE_ENV` | Environment (production/test) | — |
| `VITE_API_BASE_URL` | API base URL for frontend (only needed in prod) | `/api` |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev:server` | Start backend in watch mode |
| `pnpm run dev:web` | Start frontend dev server |
| `pnpm run build:server` | Build backend for production |
| `pnpm run build:web` | Build frontend for production |
| `pnpm test` | Run all tests (server + web) |
| `pnpm run test:e2e` | Run E2E tests |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Run Prettier check |
| `pnpm run prisma:migrate` | Create and apply migrations |
| `pnpm run prisma:deploy` | Apply migrations in production |
| `pnpm run prisma:seed` | Seed demo data |
| `pnpm run prisma:studio` | Open Prisma Studio |

---

## Deploy

### Database — Neon

1. Create a PostgreSQL database on [Neon](https://neon.tech)
2. Copy the connection string (with `?sslmode=require`)
3. Set as `DATABASE_URL` on Render

### Backend — Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Root directory: `server`
4. Build command: `pnpm run build`
5. Start command: `node dist/server/src/index.js`
6. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
7. Deploy — first request may take ~30s due to free tier spin-down

### Frontend — Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Root directory: `web`
3. Framework: Vite (auto-detected)
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
5. Deploy

---

## License

MIT
