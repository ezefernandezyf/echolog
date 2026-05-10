import { Router } from 'express';
import { createWorkspace, listWorkspaces } from './workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', listWorkspaces);
workspaceRouter.post('/', requireAuth, createWorkspace);
