import type { Request, Response } from 'express';
import { createToken, verifyToken } from '../infra/http.js';
import { parseCookies } from '../infra/request.js';
import { logger } from '../infra/logger.js';
import { authService } from './auth.service.js';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export const register = async (req: Request, res: Response) => {
  const session = await authService.register(req.body);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

  res.cookie('echolog_token', token, cookieOptions);
  res.status(201).json(session);
};

export const login = async (req: Request, res: Response) => {
  try {
    const session = await authService.login(req.body);
    const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

    res.cookie('echolog_token', token, cookieOptions);
    res.status(200).json(session);
  } catch (err) {
    logger.warn({ err, requestId: req.requestId }, 'Login failed');
    throw err;
  }
};

export const logout = (_req: Request, res: Response) => {
  res.cookie('echolog_token', '', { ...cookieOptions, maxAge: 0 });
  res.status(204).send();
};

export const session = async (req: Request, res: Response) => {
  const cookies = parseCookies(req);
  const token = cookies.echolog_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const payload = verifyToken<{ sub?: string }>(token, process.env.JWT_SECRET ?? 'dev-secret');
  if (!payload?.sub) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const sessionData = await authService.me(payload.sub);
  if (!sessionData) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  res.status(200).json(sessionData);
};

export const updateProfile = async (req: Request, res: Response) => {
  const result = await authService.updateProfile(req.userId!, req.body);
  res.status(200).json(result);
};

export const updateEmail = async (req: Request, res: Response) => {
  const result = await authService.updateEmail(req.userId!, req.body);
  res.status(200).json(result);
};

export const updatePassword = async (req: Request, res: Response) => {
  await authService.updatePassword(req.userId!, req.body);
  res.status(200).json({ message: 'Password updated successfully' });
};

export const resendVerification = async (req: Request, res: Response) => {
  const result = await authService.resendVerification(req.userId!);
  res.status(200).json(result);
};
