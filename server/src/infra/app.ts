import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from '../auth/auth.router.js';
import { commentRouter } from '../comments/comments.router.js';
import { invitationsRouter } from '../invitations/invitations.router.js';
import { notificationsRouter } from '../notifications/notifications.router.js';
import { postRouter } from '../posts/posts.router.js';
import { voteRouter } from '../votes/votes.router.js';
import { workspaceRouter } from '../workspaces/workspaces.router.js';
import { errorHandler } from './error-handler.js';
import { requestId } from './request-id.js';
import { authLimiter, invitationLimiter, voteLimiter } from './rate-limiter.js';

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
  app.use(requestId);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/workspaces', workspaceRouter);
  app.use('/api/invitations', invitationLimiter, invitationsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/boards/:boardId/posts', postRouter);
  app.use('/api/posts/:postId/vote', voteLimiter, voteRouter);
  app.use('/api/posts/:postId/comments', commentRouter);
  app.use('/api/posts', postRouter);

  app.use(errorHandler);

  return app;
};
