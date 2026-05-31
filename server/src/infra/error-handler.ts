import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from './validate.js';
import { logger } from './logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  logger.error(
    { err, requestId: req.requestId, method: req.method, url: req.url },
    'Unhandled error',
  );
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.statusCode,
      ...(err.issues && err.issues.length > 0
        ? { details: { issues: err.issues.map((i) => ({ path: i.path, message: i.message })) } }
        : {}),
    });
    return;
  }

  if (err instanceof Error) {
    const statusCode = 'statusCode' in err ? (err as { statusCode: number }).statusCode : 500;
    res.status(statusCode >= 400 ? statusCode : 500).json({
      error: true,
      message: err.message,
      code: statusCode >= 400 ? statusCode : 500,
    });
    return;
  }

  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
    code: 500,
  });
}
