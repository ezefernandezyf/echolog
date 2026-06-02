import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('sanitize scope — auth fields excluded', () => {
  it('does NOT sanitize email — HTML-like email is rejected by Zod, not stripped', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // If sanitizeInput were called on email, '<b>test@test.com</b>' would become
    // 'test@test.com' which is a valid email and would pass Zod validation.
    // Since sanitizeInput is NOT called, the raw string is passed to Zod's .email()
    // which rejects it as invalid.
    const res = await request(app).post('/api/auth/register').send({
      email: '<b>test@test.com</b>',
      password: 'password123',
      name: `SanitizeScope ${suffix}`,
    });

    expect(res.status).toBe(400);
  });

  it('does NOT sanitize password — register then login with HTML-like chars succeeds', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `pwd-scope-${suffix}@test.dev`;
    const password = '<secure>pass!23';

    // Register with password containing HTML-like characters
    const regRes = await request(app).post('/api/auth/register').send({
      email,
      password,
      name: `Password Scope ${suffix}`,
    });
    expect(regRes.status).toBe(201);

    // Login with the same password — if password was sanitized before hashing,
    // the stored hash would be for a different password and login would fail.
    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(email);
  });

  it('does NOT sanitize passwordHash — register then login with special chars works', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `hash-scope-${suffix}@test.dev`;
    const password = 'pass<script>alert(1)</script>word';

    // Register with a password containing script-like characters
    const regRes = await request(app).post('/api/auth/register').send({
      email,
      password,
      name: `Hash Scope ${suffix}`,
    });
    expect(regRes.status).toBe(201);

    // If passwordHash were sanitized, the hash would be wrong and login would fail
    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password,
    });
    expect(loginRes.status).toBe(200);
  });
});
