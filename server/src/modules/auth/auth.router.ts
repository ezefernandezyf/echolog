import { Router } from 'express';
import { login, logout, register, session } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/session', session);
