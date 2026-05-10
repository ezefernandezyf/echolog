import type { Request, Response, NextFunction } from 'express';

// Accept any Zod-like schema with parse()
export function validate(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const issues =
        (err as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues ?? [];
      const message =
        issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation failed';
      next(new ValidationError(message, 400));
    }
  };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
