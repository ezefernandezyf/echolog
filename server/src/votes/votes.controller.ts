import type { Request, Response } from 'express';
import { votesService } from './votes.service.js';

export const toggleVote = async (req: Request, res: Response) => {
  const data = await votesService.toggle(req.params.postId as string, req.userId!);
  res.status(200).json(data);
};
