import { Router } from 'express';
import { boardRouter } from '../boards/boards.router.js';
import {
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createWorkspace,
  deleteWorkspace,
  getPublicWorkspace,
  getWorkspace,
  listInvitations,
  listMembers,
  listPublicWorkspaces,
  listWorkspaces,
  removeMember,
  updateVisibility,
  updateWorkspace,
} from './workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireAdminOrOwner, requireAnyMember } from '../auth/require-member.middleware.js';
import { validate } from '../infra/validate.js';
import {
  changeRoleSchema,
  createInvitationSchema,
  createWorkspaceSchema,
  UpdateVisibilityDTOSchema,
  updateWorkspaceSchema,
} from '../../../shared/contracts/index.js';

export const workspaceRouter = Router();

// ── Public discovery (no auth required, rate-limited in app.ts) ───────
workspaceRouter.get('/public', listPublicWorkspaces);
workspaceRouter.get('/public/:slug', getPublicWorkspace);

// ── Visibility toggle (owner-only) ────────────────────────────────────
workspaceRouter.patch(
  '/:workspaceId/visibility',
  requireAuth,
  validate(UpdateVisibilityDTOSchema),
  updateVisibility,
);

// ── CRUD routes ───────────────────────────────────────────────────────
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
workspaceRouter.delete(
  '/:workspaceId/members/:userId',
  requireAuth,
  requireAdminOrOwner,
  removeMember,
);

// ── Invitation Routes (workspace-scoped) ──────────────────────────────

workspaceRouter.get('/:workspaceId/invitations', requireAuth, requireAdminOrOwner, listInvitations);
workspaceRouter.post(
  '/:workspaceId/invitations',
  requireAuth,
  requireAdminOrOwner,
  validate(createInvitationSchema),
  createInvitation,
);
workspaceRouter.delete(
  '/:workspaceId/invitations/:invitationId',
  requireAuth,
  requireAdminOrOwner,
  cancelInvitation,
);
