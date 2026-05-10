import type { Request, Response } from 'express';
import { createToken, verifyToken } from '../infra/http.js';
import { parseCookies } from '../infra/request.js';
import { authService } from './auth.service.js';

const cookieOptions = 'HttpOnly; Path=/; SameSite=Lax';

export const register = async (req: Request, res: Response) => {
  const session = await authService.register(req.body);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

  res.setHeader('Set-Cookie', `echolog_token=${token}; ${cookieOptions}`);
  res.status(201).json(session);
};

export const login = async (req: Request, res: Response) => {
  const session = await authService.login(req.body);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

  res.setHeader('Set-Cookie', `echolog_token=${token}; ${cookieOptions}`);
  res.status(200).json(session);
};

export const logout = (_req: Request, res: Response) => {
  res.setHeader('Set-Cookie', 'echolog_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
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
