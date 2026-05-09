import 'dotenv/config';
import express from 'express';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const env = envSchema.parse(process.env);

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(`EchoLog server listening on port ${env.PORT} (${env.NODE_ENV})`);
});
