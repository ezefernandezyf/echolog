import { Router } from 'express';
import {
  login,
  logout,
  register,
  session,
  updateProfile,
  updateEmail,
  updatePassword,
  resendVerification,
  verifyEmail,
} from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import { validate } from '../infra/validate.js';
import {
  authLoginSchema,
  authRegisterSchema,
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from '../../../shared/contracts/index.js';

export const authRouter = Router();

authRouter.post('/register', validate(authRegisterSchema), register);
authRouter.post('/login', validate(authLoginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', session);
authRouter.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
authRouter.put('/email', requireAuth, validate(updateEmailSchema), updateEmail);
authRouter.put('/password', requireAuth, validate(updatePasswordSchema), updatePassword);
authRouter.post('/resend-verification', requireAuth, resendVerification);
authRouter.get('/verify-email/:token', verifyEmail);
