import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../infra/http.js';
import { parseCookies } from '../infra/request.js';

// Augment Express Request
declare module 'express' {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
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

    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthenticated' });
  }
}
