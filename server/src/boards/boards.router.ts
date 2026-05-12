import { Router } from 'express';
import { createBoard, deleteBoard, listBoards, updateBoard } from './boards.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createBoardSchema, updateBoardSchema } from '../../../shared/contracts/index.js';

export const boardRouter = Router({ mergeParams: true });

boardRouter.get('/', listBoards);
boardRouter.post('/', requireAuth, validate(createBoardSchema), createBoard);
boardRouter.patch('/:boardId', requireAuth, validate(updateBoardSchema), updateBoard);
boardRouter.delete('/:boardId', requireAuth, deleteBoard);
