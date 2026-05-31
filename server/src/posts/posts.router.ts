import { Router } from 'express';
import { createPost, getPostById, listPosts, updatePostStatus } from './posts.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireWorkspaceAdmin } from '../auth/require-admin.middleware.js';
import { requireBoardMember, requirePostMember } from '../auth/require-member.middleware.js';
import { validate } from '../infra/validate.js';
import { createPostSchema, updatePostStatusSchema } from '../../../shared/contracts/index.js';

export const postRouter = Router({ mergeParams: true });

postRouter.get('/', requireAuth, requireBoardMember(), listPosts);
postRouter.get('/:postId', requireAuth, requirePostMember(), getPostById);
postRouter.post(
  '/',
  requireAuth,
  requireBoardMember(['OWNER', 'ADMIN', 'MEMBER']),
  validate(createPostSchema),
  createPost,
);
postRouter.patch(
  '/:postId/status',
  requireAuth,
  requireWorkspaceAdmin,
  validate(updatePostStatusSchema),
  updatePostStatus,
);
