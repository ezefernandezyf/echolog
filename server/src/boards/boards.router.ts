import { Router } from 'express';
import { createBoard, listBoards } from './boards.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createBoardSchema } from '../../../shared/contracts/index.js';

export const boardRouter = Router({ mergeParams: true });

boardRouter.get('/', listBoards);
boardRouter.post('/', requireAuth, validate(createBoardSchema), createBoard);
