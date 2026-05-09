import { Router } from 'express';
import { loginAuthSchema, registerAuthSchema } from '../../../../shared/types/auth.js';
import { authService } from './auth.service.js';
import { createToken, verifyToken } from '../../lib/http.js';
import { parseCookies } from '../../lib/request.js';

const cookieName = 'echolog_token';
const cookieOptions = 'HttpOnly; Path=/; SameSite=Lax';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const payload = registerAuthSchema.parse(req.body);
  const session = authService.register(payload);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');
  res.setHeader('Set-Cookie', `${cookieName}=${token}; ${cookieOptions}`);
  res.status(201).json(session);
});

authRouter.post('/login', (req, res) => {
  const payload = loginAuthSchema.parse(req.body);
  const session = authService.login(payload);
  const token = createToken({ sub: session.user.id }, process.env.JWT_SECRET ?? 'dev-secret');
  res.setHeader('Set-Cookie', `${cookieName}=${token}; ${cookieOptions}`);
  res.status(200).json(session);
});

authRouter.post('/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[cookieName];
  if (token) {
    verifyToken<{ sub?: string }>(token, process.env.JWT_SECRET ?? 'dev-secret');
  }
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.status(204).send();
});

authRouter.get('/session', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[cookieName];
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
});
