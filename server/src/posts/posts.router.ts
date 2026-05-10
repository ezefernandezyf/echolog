import { Router } from 'express';
import { createPost, listPosts } from './posts.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const postRouter = Router({ mergeParams: true });

postRouter.get('/', listPosts);
postRouter.post('/', requireAuth, createPost);
