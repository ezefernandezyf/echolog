import type { Request, Response } from 'express';
import { createPostSchema } from '../../../shared/contracts/index.js';
import { postsService } from './posts.service.js';

export const listPosts = (req: Request, res: Response) => {
  res.status(200).json(postsService.list(req.params.boardId as string));
};

export const createPost = (req: Request, res: Response) => {
  const body = createPostSchema.parse(req.body);
  res.status(201).json(postsService.create(req.params.boardId as string, body));
};
