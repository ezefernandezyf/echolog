import type { Request, Response } from 'express';
import { boardsService } from './boards.service.js';

export const listBoards = async (req: Request, res: Response) => {
  const data = await boardsService.list(req.params.workspaceId as string);
  res.status(200).json(data);
};

export const createBoard = async (req: Request, res: Response) => {
  const data = await boardsService.create(req.params.workspaceId as string, req.body);
  res.status(201).json(data);
};
