import type { Request, Response } from 'express';
import { createBoardSchema } from '../../../shared/contracts/index.js';
import { boardsService } from './boards.service.js';

export const listBoards = (req: Request, res: Response) => {
  res.status(200).json(boardsService.list(req.params.workspaceId as string));
};

export const createBoard = (req: Request, res: Response) => {
  const body = createBoardSchema.parse(req.body);
  res.status(201).json(boardsService.create(req.params.workspaceId as string, body));
};
