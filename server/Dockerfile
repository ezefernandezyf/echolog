FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g pnpm@11.1.2

# Copy root workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy workspace packages (needed because tsconfig has rootDir: "..")
COPY server/ ./server/
COPY shared/ ./shared/

# Install deps and build
RUN pnpm install --frozen-lockfile
RUN cd server && pnpm run build

# ── Production stage ──────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server/src/index.js"]
