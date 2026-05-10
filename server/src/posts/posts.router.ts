import { Router } from 'express';
import { createPost, listPosts } from './posts.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { validate } from '../infra/validate.js';
import { createPostSchema } from '../../../shared/contracts/index.js';

export const postRouter = Router({ mergeParams: true });

postRouter.get('/', listPosts);
postRouter.post('/', requireAuth, validate(createPostSchema), createPost);
