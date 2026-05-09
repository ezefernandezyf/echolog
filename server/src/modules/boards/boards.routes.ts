import { Router } from 'express';
import { createBoardSchema } from '../../../../shared/types/boards.js';
import { boardsService } from './boards.service.js';

export const boardsRouter = Router();

boardsRouter.get('/workspaces/:workspaceId/boards', (req, res) => {
  const boards = boardsService.list(req.params.workspaceId as string);
  res.json({ boards });
});

boardsRouter.post('/workspaces/:workspaceId/boards', (req, res) => {
  const payload = createBoardSchema.parse(req.body);
  const board = boardsService.create(req.params.workspaceId as string, payload);
  res.status(201).json({ board });
});
