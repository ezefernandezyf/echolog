import type { Request, Response } from 'express';
import { workspacesService } from './workspaces.service.js';

export const listWorkspaces = async (req: Request, res: Response) => {
  const data = await workspacesService.list(req.userId!);
  res.status(200).json(data);
};

export const getWorkspace = async (req: Request, res: Response) => {
  const data = await workspacesService.getById(req.params.workspaceId as string, req.userId!);
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

// ── Invitation Handlers ───────────────────────────────────────────────

export const createInvitation = async (req: Request, res: Response) => {
  const data = await workspacesService.createInvitation(
    req.params.workspaceId as string,
    req.body.email,
    req.body.role,
    req.userId!,
  );
  res.status(201).json(data);
};

export const getInvitationByToken = async (req: Request, res: Response) => {
  const data = await workspacesService.getInvitationByToken(req.params.token as string);
  res.status(200).json(data);
};

export const acceptInvitation = async (req: Request, res: Response) => {
  const data = await workspacesService.acceptInvitation(req.params.token as string, req.userId!);
  res.status(200).json(data);
};

export const declineInvitation = async (req: Request, res: Response) => {
  await workspacesService.declineInvitation(req.params.token as string, req.userId!);
  res.status(204).send();
};

export const listPendingInvitations = async (req: Request, res: Response) => {
  const data = await workspacesService.listPendingInvitations(req.userId!);
  res.status(200).json(data);
};

export const listInvitations = async (req: Request, res: Response) => {
  const data = await workspacesService.listWorkspaceInvitations(req.params.workspaceId as string);
  res.status(200).json(data);
};

// ── Member Handlers ───────────────────────────────────────────────────

export const listMembers = async (req: Request, res: Response) => {
  const data = await workspacesService.listWorkspaceMembers(req.params.workspaceId as string);
  res.status(200).json(data);
};

export const changeMemberRole = async (req: Request, res: Response) => {
  const data = await workspacesService.changeMemberRole(
    req.params.workspaceId as string,
    req.params.userId as string,
    req.body.role,
    req.userId!,
  );
  res.status(200).json(data);
};

export const removeMember = async (req: Request, res: Response) => {
  await workspacesService.removeMember(
    req.params.workspaceId as string,
    req.params.userId as string,
    req.userId!,
  );
  res.status(204).send();
};
