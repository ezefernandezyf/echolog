import { Router } from 'express';
import { createWorkspaceSchema } from '../../../../shared/types/workspaces.js';
import { workspacesService } from './workspaces.service.js';

export const workspacesRouter = Router();

workspacesRouter.get('/', (req, res) => {
  res.json({ workspaces: workspacesService.list() });
});

workspacesRouter.post('/', (req, res) => {
  const payload = createWorkspaceSchema.parse(req.body);
  const workspace = workspacesService.create(payload);

  res.status(201).json({ workspace });
});
