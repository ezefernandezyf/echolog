import type { Request, Response, NextFunction } from 'express';

export interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

// Accept any Zod-like schema with parse()
export function validate(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const issues: ValidationIssue[] = (err as { issues?: ValidationIssue[] }).issues ?? [];
      const message =
        issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation failed';
      next(new ValidationError(message, 400, issues));
    }
  };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public issues?: ValidationIssue[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
