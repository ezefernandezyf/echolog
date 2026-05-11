import { Router } from 'express';
import { createPost, getPostById, listPosts, updatePostStatus } from './posts.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireWorkspaceAdmin } from '../auth/require-admin.middleware.js';
import { validate } from '../infra/validate.js';
import { createPostSchema, updatePostStatusSchema } from '../../../shared/contracts/index.js';

export const postRouter = Router({ mergeParams: true });

postRouter.get('/', listPosts);
postRouter.get('/:postId', requireAuth, getPostById);
postRouter.post('/', requireAuth, validate(createPostSchema), createPost);
postRouter.patch(
  '/:postId/status',
  requireAuth,
  requireWorkspaceAdmin,
  validate(updatePostStatusSchema),
  updatePostStatus,
);
