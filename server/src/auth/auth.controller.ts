import type { Request, Response } from 'express';
import { authLoginSchema, authRegisterSchema } from '../../../shared/contracts/index.js';
import { createToken, verifyToken } from '../infra/http.js';
import { parseCookies } from '../infra/request.js';
import { authService } from './auth.service.js';

const cookieOptions = 'HttpOnly; Path=/; SameSite=Lax';

export const register = (req: Request, res: Response) => {
  const body = authRegisterSchema.parse(req.body);
  const session = authService.register(body);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

  res.setHeader('Set-Cookie', `echolog_token=${token}; ${cookieOptions}`);
  res.status(201).json(session);
};

export const login = (req: Request, res: Response) => {
  const body = authLoginSchema.parse(req.body);
  const session = authService.login(body);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');

  res.setHeader('Set-Cookie', `echolog_token=${token}; ${cookieOptions}`);
  res.status(200).json(session);
};

export const logout = (_req: Request, res: Response) => {
  res.setHeader('Set-Cookie', 'echolog_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.status(204).send();
};

export const session = (req: Request, res: Response) => {
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

  const session = authService.me(payload.sub);
  if (!session) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  res.status(200).json(session);
};
