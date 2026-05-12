import type { Request, Response } from 'express';
import { postsService } from './posts.service.js';

const VALID_STATUSES = ['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE'];
const VALID_SORTS = ['trending', 'top', 'new'];
const DEFAULT_LIMIT = 20;

export const listPosts = async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' && VALID_STATUSES.includes(req.query.status)
    ? req.query.status
    : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const sort = typeof req.query.sort === 'string' && VALID_SORTS.includes(req.query.sort)
    ? (req.query.sort as 'trending' | 'top' | 'new')
    : undefined;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), 50);

  const data = await postsService.list({
    boardId: req.params.boardId as string,
    status,
    search,
    sort,
    cursor,
    limit,
  });

  res.status(200).json(data);
};

export const createPost = async (req: Request, res: Response) => {
  const data = await postsService.create(req.params.boardId as string, req.body, req.userId!);
  res.status(201).json(data);
};

export const getPostById = async (req: Request, res: Response) => {
  const data = await postsService.getById(req.params.postId as string, req.userId);
  res.status(200).json(data);
};

export const updatePostStatus = async (req: Request, res: Response) => {
  const data = await postsService.updateStatus(req.params.postId as string, req.body.status);
  res.status(200).json(data);
};
