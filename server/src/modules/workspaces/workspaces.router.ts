import { Router } from 'express';
import { createWorkspace, listWorkspaces } from './workspaces.controller.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', listWorkspaces);
workspaceRouter.post('/', createWorkspace);
