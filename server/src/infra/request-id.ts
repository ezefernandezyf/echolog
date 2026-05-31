import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  // Express type augmentation uses `namespace Express` intentionally — the
  // open `Express.Request` interface in express-serve-static-core is designed
  // for declaration merging. This is a required pattern, not a lint violation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
