import type { Request, Response } from 'express';
import { workspacesService } from './workspaces.service.js';

export const listWorkspaces = async (req: Request, res: Response) => {
  const data = await workspacesService.list(req.userId!);
  res.status(200).json(data);
};

export const createWorkspace = async (req: Request, res: Response) => {
  const data = await workspacesService.create(req.body, req.userId!);
  res.status(201).json(data);
};
