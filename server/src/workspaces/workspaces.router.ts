import { Router } from 'express';
import { boardRouter } from '../boards/boards.router.js';
import {
  changeMemberRole,
  createInvitation,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listInvitations,
  listMembers,
  listWorkspaces,
  removeMember,
  updateWorkspace,
} from './workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireAdminOrOwner, requireAnyMember } from '../auth/require-member.middleware.js';
import { validate } from '../infra/validate.js';
import {
  changeRoleSchema,
  createInvitationSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '../../../shared/contracts/index.js';

export const workspaceRouter = Router();

workspaceRouter.get('/', requireAuth, listWorkspaces);
workspaceRouter.get('/:workspaceId', requireAuth, getWorkspace);
workspaceRouter.post('/', requireAuth, validate(createWorkspaceSchema), createWorkspace);
workspaceRouter.patch(
  '/:workspaceId',
  requireAuth,
  validate(updateWorkspaceSchema),
  updateWorkspace,
);
workspaceRouter.delete('/:workspaceId', requireAuth, deleteWorkspace);

workspaceRouter.use('/:workspaceId/boards', boardRouter);

// ── Member Routes (workspace-scoped) ──────────────────────────────────

workspaceRouter.get('/:workspaceId/members', requireAuth, requireAnyMember, listMembers);
workspaceRouter.patch(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireAdminOrOwner,
  validate(changeRoleSchema),
  changeMemberRole,
);
workspaceRouter.delete('/:workspaceId/members/:userId', requireAuth, requireAdminOrOwner, removeMember);

// ── Invitation Routes (workspace-scoped) ──────────────────────────────

workspaceRouter.get('/:workspaceId/invitations', requireAuth, requireAdminOrOwner, listInvitations);
workspaceRouter.post(
  '/:workspaceId/invitations',
  requireAuth,
  requireAdminOrOwner,
  validate(createInvitationSchema),
  createInvitation,
);
