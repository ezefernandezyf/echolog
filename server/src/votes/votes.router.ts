import { Router } from 'express';
import { addVote, removeVote } from './votes.controller.js';

export const voteRouter = Router({ mergeParams: true });

voteRouter.post('/', addVote);
voteRouter.delete('/', removeVote);
