import { Router } from 'express';
import { createPost, listPosts } from './posts.controller.js';

export const postRouter = Router({ mergeParams: true });

postRouter.get('/', listPosts);
postRouter.post('/', createPost);
