import { Router } from 'express';
import { votesService } from './votes.service.js';

export const votesRouter = Router();

votesRouter.post('/posts/:postId/vote', (req, res) => {
  try {
    const vote = votesService.add(req.params.postId as string, 'user-1');
    res.status(201).json({ vote });
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : 500;
    res.status(statusCode).json({ message: error instanceof Error ? error.message : 'Unexpected error' });
  }
});

votesRouter.delete('/posts/:postId/vote', (req, res) => {
  try {
    votesService.remove(req.params.postId as string, 'user-1');
    res.status(204).send();
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : 500;
    res.status(statusCode).json({ message: error instanceof Error ? error.message : 'Unexpected error' });
  }
});
