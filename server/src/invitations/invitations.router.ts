import { Router } from 'express';
import {
  acceptInvitation,
  declineInvitation,
  getInvitationByToken,
} from '../workspaces/workspaces.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const invitationsRouter = Router();

// Public — anyone can look up an invitation by token (no auth required)
invitationsRouter.get('/:token', getInvitationByToken);

// Authenticated — user must be logged in to accept/decline
invitationsRouter.post('/:token/accept', requireAuth, acceptInvitation);
invitationsRouter.post('/:token/decline', requireAuth, declineInvitation);
