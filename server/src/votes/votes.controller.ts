import type { Request, Response } from 'express';
import { votesService } from './votes.service.js';

export const addVote = (req: Request, res: Response) => {
  res.status(201).json(votesService.add(req.params.postId as string, 'user-1'));
};

export const removeVote = (req: Request, res: Response) => {
  res.status(200).json(votesService.remove(req.params.postId as string, 'user-1'));
};
