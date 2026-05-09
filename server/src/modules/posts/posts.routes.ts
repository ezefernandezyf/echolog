import { Router } from 'express';
import { createPostSchema } from '../../../../shared/types/posts.js';
import { postsService } from './posts.service.js';

export const postsRouter = Router();

postsRouter.get('/boards/:boardId/posts', (req, res) => {
  const posts = postsService.list(req.params.boardId as string);
  res.json({ posts });
});

postsRouter.post('/boards/:boardId/posts', (req, res) => {
  const payload = createPostSchema.parse(req.body);
  const post = postsService.create(req.params.boardId as string, payload);
  res.status(201).json({ post });
});
