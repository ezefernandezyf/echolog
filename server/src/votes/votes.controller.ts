import type { Request, Response } from 'express';
import { votesService } from './votes.service.js';

export const addVote = async (req: Request, res: Response) => {
  try {
    const data = await votesService.add(req.params.postId as string, req.userId!);
    res.status(201).json(data);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeVote = async (req: Request, res: Response) => {
  try {
    const data = await votesService.remove(req.params.postId as string, req.userId!);
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
