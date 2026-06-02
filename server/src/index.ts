import 'dotenv/config';
import { createApp } from './infra/app.js';
import { logger } from './infra/logger.js';
import { prisma } from './infra/prisma.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  // Log DB connection info on startup for diagnostics
  const dbHost = process.env.DATABASE_URL?.includes('@')
    ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] ?? 'unknown'
    : 'not set';

  prisma.user
    .count()
    .then((users) => prisma.workspace.count().then((workspaces) => ({ users, workspaces })))
    .then(({ users, workspaces }) => {
      logger.info({ host: dbHost, users, workspaces }, 'Database connected');
    })
    .catch((err) => {
      logger.error({ host: dbHost, err: (err as Error).message }, 'Database connection failed');
    });

  app.listen(port, '0.0.0.0', () => {
    logger.info({ port }, 'EchoLog server started');
  });
}

export default app;
