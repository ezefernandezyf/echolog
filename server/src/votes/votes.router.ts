import { Router } from 'express';
import { addVote, removeVote } from './votes.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const voteRouter = Router({ mergeParams: true });

voteRouter.post('/', requireAuth, addVote);
voteRouter.delete('/', requireAuth, removeVote);
