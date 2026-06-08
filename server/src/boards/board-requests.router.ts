import { Router } from 'express';
import { createBoardRequest, updateBoardRequest } from './board-requests.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireWorkspaceMember, requireAdminOrOwner } from '../auth/require-member.middleware.js';
import { validate } from '../infra/validate.js';
import {
  createBoardRequestSchema,
  updateBoardRequestSchema,
} from '../../../shared/contracts/index.js';

export const boardRequestsRouter = Router({ mergeParams: true });

boardRequestsRouter.post(
  '/',
  requireAuth,
  requireWorkspaceMember(['OWNER', 'ADMIN', 'MEMBER']),
  validate(createBoardRequestSchema),
  createBoardRequest,
);

boardRequestsRouter.patch(
  '/:requestId',
  requireAuth,
  requireAdminOrOwner,
  validate(updateBoardRequestSchema),
  updateBoardRequest,
);
