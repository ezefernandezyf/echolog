import 'dotenv/config';
import { createApp } from './infra/app.js';
import { logger } from './infra/logger.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    logger.info({ port }, 'EchoLog server started');
  });
  // test merge trigger — remove after diagnosing
}

export default app;
