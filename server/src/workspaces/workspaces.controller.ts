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

export const updateWorkspace = async (req: Request, res: Response) => {
  const data = await workspacesService.update(
    req.params.workspaceId as string,
    req.body,
    req.userId!,
  );
  res.status(200).json(data);
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  await workspacesService.delete(req.params.workspaceId as string, req.userId!);
  res.status(204).send();
};
