import type { Request, Response } from 'express';
import { createBoardSchema } from '../../../shared/contracts/index.js';
import { boardsService } from './boards.service.js';

export const listBoards = async (req: Request, res: Response) => {
  try {
    const data = await boardsService.list(req.params.workspaceId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  try {
    const body = createBoardSchema.parse(req.body);
    const data = await boardsService.create(req.params.workspaceId, body);
    res.status(201).json(data);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
