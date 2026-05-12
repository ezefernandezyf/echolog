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

export const updateBoard = async (req: Request, res: Response) => {
  const data = await boardsService.update(req.params.boardId as string, req.body, req.userId!);
  res.status(200).json(data);
};

export const deleteBoard = async (req: Request, res: Response) => {
  await boardsService.delete(req.params.boardId as string, req.userId!);
  res.status(204).send();
};
