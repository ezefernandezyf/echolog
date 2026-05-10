import type { Request, Response } from 'express';
import { postsService } from './posts.service.js';

export const listPosts = async (req: Request, res: Response) => {
  const data = await postsService.list(req.params.boardId as string);
  res.status(200).json(data);
};

export const createPost = async (req: Request, res: Response) => {
  const data = await postsService.create(req.params.boardId as string, req.body, req.userId!);
  res.status(201).json(data);
};
