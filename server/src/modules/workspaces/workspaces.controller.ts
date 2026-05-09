import type { Request, Response } from 'express';
import { createWorkspaceSchema } from '../../../../shared/contracts/index.js';
import { workspacesService } from './workspaces.service.js';

export const listWorkspaces = (_req: Request, res: Response) => {
  res.status(200).json(workspacesService.list());
};

export const createWorkspace = (req: Request, res: Response) => {
  const body = createWorkspaceSchema.parse(req.body);
  res.status(201).json(workspacesService.create(body));
};
