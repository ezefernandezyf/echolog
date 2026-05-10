import express from 'express';
import { authRouter } from '../auth/auth.router.js';
import { boardRouter } from '../boards/boards.router.js';
import { postRouter } from '../posts/posts.router.js';
import { voteRouter } from '../votes/votes.router.js';
import { workspaceRouter } from '../workspaces/workspaces.router.js';

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/workspaces', workspaceRouter);
  app.use('/api/workspaces/:workspaceId/boards', boardRouter);
  app.use('/api/boards/:boardId/posts', postRouter);
  app.use('/api/posts/:postId/vote', voteRouter);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
        return;
      }

      res.status(500).json({ error: 'Internal Server Error' });
    },
  );

  return app;
};
