import { Router } from 'express';
import { login, logout, register, session } from './auth.controller.js';
import { validate } from '../infra/validate.js';
import { authLoginSchema, authRegisterSchema } from '../../../shared/contracts/index.js';

export const authRouter = Router();

authRouter.post('/register', validate(authRegisterSchema), register);
authRouter.post('/login', validate(authLoginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', session);
