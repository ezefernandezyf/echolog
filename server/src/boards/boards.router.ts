import { Router } from 'express';
import { createBoard, listBoards } from './boards.controller.js';

export const boardRouter = Router({ mergeParams: true });

boardRouter.get('/', listBoards);
boardRouter.post('/', createBoard);
