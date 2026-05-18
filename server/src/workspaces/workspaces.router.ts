import { Router } from 'express';
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  updateWorkspace,
} from './workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../../../shared/contracts/index.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', requireAuth, listWorkspaces);
workspaceRouter.post('/', requireAuth, validate(createWorkspaceSchema), createWorkspace);
workspaceRouter.patch(
  '/:workspaceId',
  requireAuth,
  validate(updateWorkspaceSchema),
  updateWorkspace,
);
workspaceRouter.delete('/:workspaceId', requireAuth, deleteWorkspace);
