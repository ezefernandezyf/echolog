import { Router } from 'express';
import { createComment, deleteComment, listComments } from './comments.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createCommentSchema } from '../../../shared/contracts/index.js';

export const commentRouter = Router({ mergeParams: true });

commentRouter.get('/', listComments);
commentRouter.post('/', requireAuth, validate(createCommentSchema), createComment);
commentRouter.delete('/:commentId', requireAuth, deleteComment);
