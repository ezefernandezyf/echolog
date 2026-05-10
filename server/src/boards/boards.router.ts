import { Router } from 'express';
import { createBoard, listBoards } from './boards.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const boardRouter = Router({ mergeParams: true });

boardRouter.get('/', listBoards);
boardRouter.post('/', requireAuth, createBoard);
