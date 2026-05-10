import { Router } from 'express';
import { createWorkspace, listWorkspaces } from './workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createWorkspaceSchema } from '../../../shared/contracts/index.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', listWorkspaces);
workspaceRouter.post('/', requireAuth, validate(createWorkspaceSchema), createWorkspace);
