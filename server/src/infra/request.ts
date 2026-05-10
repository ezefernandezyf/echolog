import type { Request } from 'express';

export const parseCookies = (req: Request) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(';').map((cookie) => {
      const [key, ...rest] = cookie.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    }),
  );
};
