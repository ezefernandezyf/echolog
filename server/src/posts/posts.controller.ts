import type { Request, Response } from 'express';
import { createPostSchema } from '../../../shared/contracts/index.js';
import { postsService } from './posts.service.js';

export const listPosts = async (req: Request, res: Response) => {
  try {
    const data = await postsService.list(req.params.boardId as string);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const body = createPostSchema.parse(req.body);
    const data = await postsService.create(req.params.boardId as string, body, req.userId!);
    res.status(201).json(data);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
