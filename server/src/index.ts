import 'dotenv/config';
import { createApp } from './infra/app.js';
import { logger } from './infra/logger.js';
import { prisma } from './infra/prisma.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  const dbHost = process.env.DATABASE_URL?.includes('@')
    ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] ?? 'unknown'
    : 'not set';

  // Retry DB connection on startup — managed Postgres may be waking from auto-suspend
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 3000;

  async function connectWithRetry(attempt = 1): Promise<void> {
    try {
      // eslint-disable-next-line no-restricted-syntax
      const [{count: users}] = await prisma.$queryRawUnsafe<[{count: bigint}]>('SELECT COUNT(*)::int FROM "User"');
      // eslint-disable-next-line no-restricted-syntax
      const [{count: workspaces}] = await prisma.$queryRawUnsafe<[{count: bigint}]>('SELECT COUNT(*)::int FROM "Workspace"');
      logger.info({ host: dbHost, users, workspaces, attempt }, 'Database connected');
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        logger.warn(
          { host: dbHost, attempt, err: (err as Error).message },
          `DB unreachable — retrying in ${RETRY_DELAY_MS / 1000}s`,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return connectWithRetry(attempt + 1);
      }
      logger.error(
        { host: dbHost, attempts: MAX_RETRIES, err: (err as Error).message },
        'Database connection failed after max retries',
      );
    }
  }

  connectWithRetry().then(() => {
    app.listen(port, '0.0.0.0', () => {
      logger.info({ port }, 'EchoLog server started');
    });
  });
}

export default app;
