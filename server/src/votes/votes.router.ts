import { Router } from 'express';
import { addVote, removeVote } from './votes.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePostMember } from '../auth/require-member.middleware.js';

export const voteRouter = Router({ mergeParams: true });

// POST  /api/posts/:postId/vote — ADD a vote (409 if already voted)
voteRouter.post('/', requireAuth, requirePostMember(), addVote);

// DELETE /api/posts/:postId/vote — REMOVE a vote (succeeds silently if not voted)
voteRouter.delete('/', requireAuth, requirePostMember(), removeVote);
