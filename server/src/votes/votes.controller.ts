import type { Request, Response } from 'express';
import { votesService } from './votes.service.js';

export const addVote = async (req: Request, res: Response) => {
  const data = await votesService.add(req.params.postId as string, req.userId!);
  res.status(201).json(data);
};

export const removeVote = async (req: Request, res: Response) => {
  const data = await votesService.remove(req.params.postId as string, req.userId!);
  res.status(200).json(data);
};
