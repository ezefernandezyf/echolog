import { Router } from 'express';
import { createBoard, deleteBoard, listBoards, updateBoard } from './boards.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireWorkspaceMember, requireAnyMember } from '../auth/require-member.middleware.js';
import { validate } from '../infra/validate.js';
import { createBoardSchema, updateBoardSchema } from '../../../shared/contracts/index.js';

export const boardRouter = Router({ mergeParams: true });

boardRouter.get('/', requireAuth, requireAnyMember, listBoards);
boardRouter.post('/', requireAuth, requireWorkspaceMember(['OWNER', 'ADMIN', 'MEMBER']), validate(createBoardSchema), createBoard);
boardRouter.patch('/:boardId', requireAuth, validate(updateBoardSchema), updateBoard);
boardRouter.delete('/:boardId', requireAuth, deleteBoard);
