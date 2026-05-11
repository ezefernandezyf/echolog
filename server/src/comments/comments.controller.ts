import type { Request, Response, NextFunction } from 'express';
import { commentsService } from './comments.service.js';

export const listComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await commentsService.list(req.params.postId as string);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await commentsService.create(req.params.postId as string, req.body, req.userId!);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};
