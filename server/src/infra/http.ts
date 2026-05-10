import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export const createToken = (payload: Record<string, unknown>, secret: string) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
};

export const verifyToken = <T extends Record<string, unknown>>(
  token: string,
  secret: string,
): T | null => {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (expected !== signature) return null;

  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
};
