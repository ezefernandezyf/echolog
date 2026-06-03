import rateLimit from 'express-rate-limit';
import type { RateLimitRequestHandler } from 'express-rate-limit';

export type { RateLimitRequestHandler };

export interface RateLimiterOptions {
  message?: Record<string, unknown>;
  skip?: () => boolean;
}

/**
 * Factory function to create an express-rate-limit middleware instance.
 *
 * @param windowMs — time window in milliseconds
 * @param max — max requests per window
 * @param options — optional message and skip override
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  options?: RateLimiterOptions,
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: options?.message ?? {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: true,
    skip: options?.skip ?? (() => process.env.NODE_ENV === 'test'),
  });
};

/**
 * Pre-configured limiters — these skip in test environment (NODE_ENV=test).
 *
 * authLimiter:       20 requests per 15 minutes — brute-force prevention for login/register
 * invitationLimiter: 20 requests per 15 minutes — spam prevention for invitations
 * voteLimiter:       30 requests per 1 minute    — abuse prevention for voting
 */
export const authLimiter = createRateLimiter(15 * 60 * 1000, 20);
export const invitationLimiter = createRateLimiter(15 * 60 * 1000, 20);
export const voteLimiter = createRateLimiter(60 * 1000, 30);
export const publicWorkspaceLimiter = createRateLimiter(60 * 1000, 30);
export const publicPostLimiter = createRateLimiter(60 * 1000, 60);
