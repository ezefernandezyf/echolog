import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from '../auth/auth.router.js';
import { commentRouter } from '../comments/comments.router.js';
import { postRouter } from '../posts/posts.router.js';
import { voteRouter } from '../votes/votes.router.js';
import { workspaceRouter } from '../workspaces/workspaces.router.js';
import { errorHandler } from './error-handler.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/workspaces', workspaceRouter);
  app.use('/api/boards/:boardId/posts', postRouter);
  app.use('/api/posts/:postId/vote', voteRouter);
  app.use('/api/posts/:postId/comments', commentRouter);
  app.use('/api/posts', postRouter);

  app.use(errorHandler);

  return app;
};
