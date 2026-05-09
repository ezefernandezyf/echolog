import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`EchoLog server listening on port ${port}`);
  });
}

export default app;
