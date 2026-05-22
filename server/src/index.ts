import 'dotenv/config';
import { createApp } from './infra/app.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`EchoLog server listening on port ${port}`);
  });
}

export default app;
