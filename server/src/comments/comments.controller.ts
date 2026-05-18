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

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await commentsService.delete(req.params.commentId as string, req.userId!);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};
