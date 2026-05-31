import request from 'supertest';
import express from 'express';
import { authRouter } from '../src/auth/auth.router.js';
import { authLimiter, createRateLimiter } from '../src/infra/rate-limiter.js';

describe('rate limiting', () => {
  it('returns 429 after 5 rapid requests to /api/auth/login', async () => {
    const app = express();
    app.use(express.json());

    // Create a limiter that NEVER skips — even in test env
    const authLimiter = createRateLimiter(15 * 60 * 1000, 5, {
      skip: () => false,
    });
    app.use('/api/auth', authLimiter, authRouter);

    // Send 5 requests — all should be accepted (not 429)
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: `ratelimit-user-${i}@test.dev`, password: 'password123' });

      expect(response.status).not.toBe(429);
    }

    // 6th request — MUST be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ratelimit-user-6@test.dev', password: 'password123' });

    expect(response.status).toBe(429);
    expect(response.body).toMatchObject({
      error: 'Too many requests',
      retryAfter: 900, // 15 minutes = 900 seconds
    });
    expect(response.headers).toHaveProperty('ratelimit-limit');
    expect(response.headers['ratelimit-limit']).toBe('5');
    expect(response.headers).toHaveProperty('ratelimit-remaining');
    expect(response.headers['ratelimit-remaining']).toBe('0');
    expect(response.headers).toHaveProperty('ratelimit-reset');
  });

  it('includes RateLimit-* headers on 429 response', async () => {
    const app = express();
    app.use(express.json());

    const authLimiter = createRateLimiter(15 * 60 * 1000, 5, {
      skip: () => false,
    });
    app.use('/api/auth', authLimiter, authRouter);

    // Exhaust the 5-request limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: `ratelimit-retry-${i}@test.dev`, password: 'password123' });
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ratelimit-retry-6@test.dev', password: 'password123' });

    expect(response.status).toBe(429);
    expect(response.body).toMatchObject({
      error: 'Too many requests',
      retryAfter: 900,
    });
    expect(response.headers).toHaveProperty('retry-after');
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('allows requests within the limit without 429', async () => {
    const app = express();
    app.use(express.json());

    // Use a higher limit so we can verify normal behavior
    const generousLimiter = createRateLimiter(15 * 60 * 1000, 10, {
      skip: () => false,
    });
    app.use('/api/auth', generousLimiter, authRouter);

    // 6 requests — all should be allowed
    for (let i = 0; i < 6; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: `ratelimit-normal-${i}@test.dev`, password: 'password123' });

      expect(response.status).not.toBe(429);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(Number(response.headers['ratelimit-remaining'])).toBeGreaterThanOrEqual(
        10 - (i + 1),
      );
    }
  });

  // RL-1: Rate limiting disabled in test environment
  it('RL-1: rate limiting is disabled when NODE_ENV=test (default skip behavior)', async () => {
    const app = express();
    app.use(express.json());

    // Use the PRE-CONFIGURED authLimiter which has the default skip function:
    //   skip: () => process.env.NODE_ENV === 'test'
    // In test environment, rate limiting is bypassed entirely.
    app.use('/api/auth', authLimiter, authRouter);

    // Send well over the 5-request limit — ALL must succeed (no 429)
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: `rl-disabled-${i}@test.dev`, password: 'password123' });

      expect(response.status).not.toBe(429);
    }
  });
});
