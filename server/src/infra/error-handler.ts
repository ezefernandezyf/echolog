import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from './validate.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(
    '[ERROR-HANDLER]',
    err instanceof Error ? err.message : String(err),
    err instanceof Error ? err.stack : '',
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
