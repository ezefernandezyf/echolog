import { Router } from 'express';
import { toggleVote } from './votes.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const voteRouter = Router({ mergeParams: true });

voteRouter.post('/', requireAuth, toggleVote);
