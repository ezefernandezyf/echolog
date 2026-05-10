import type { Request, Response } from 'express';
import { createWorkspaceSchema } from '../../../shared/contracts/index.js';
import { workspacesService } from './workspaces.service.js';

export const listWorkspaces = async (_req: Request, res: Response) => {
  try {
    const data = await workspacesService.list();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const body = createWorkspaceSchema.parse(req.body);
    const data = await workspacesService.create(body, req.userId!);
    res.status(201).json(data);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
