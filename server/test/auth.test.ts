import crypto from 'node:crypto';
import request from 'supertest';
import { vi, expect } from 'vitest';

// Mock email service to avoid real API calls during integration tests
const { mockSendWelcomeEmail } = vi.hoisted(() => ({
  mockSendWelcomeEmail: vi.fn(),
}));

vi.mock('../src/email/email.service', () => ({
  emailService: {
    sendInvitationEmail: vi.fn(),
    sendRoleChangedEmail: vi.fn(),
    sendWelcomeEmail: mockSendWelcomeEmail,
    sendVerificationEmail: vi.fn(),
  },
}));

import app from '../src/index.js';

describe('auth routes', () => {
  it('rejects invalid registration payloads', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad', password: '123' });
    expect(response.status).toBe(400);
  });

  it('registers a new user and sets auth cookie', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `newuser-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'New User',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(`newuser-${suffix}@test.dev`);
    expect(response.body.user.name).toBe('New User');

    // Cookie must be set
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('echolog_token='))
      : cookies;
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
    expect(tokenCookie).toContain('Path=/');
  });

  it('calls sendWelcomeEmail on registration', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `welcome-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'Welcome User',
      });

    expect(response.status).toBe(201);
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      `welcome-${suffix}@test.dev`,
      'Welcome User',
    );
  });

  it('logs in an existing user and sets auth cookie', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `loginuser-${suffix}@test.dev`;

    // Register first
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'secret12345', name: 'Login User' });

    // Then login
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'secret12345' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);

    // Cookie must be set
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c) => c.startsWith('echolog_token='))
      : cookies;
    expect(tokenCookie).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `wrongpw-${suffix}@test.dev`;

    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'secret12345', name: 'User' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  it('returns session for authenticated user', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register + login via agent (cookies auto-managed)
    await agent
      .post('/api/auth/register')
      .send({ email: `session-${suffix}@test.dev`, password: 'secret12345', name: 'Session User' });

    const response = await agent.get('/api/auth/me');
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(`session-${suffix}@test.dev`);
  });

  it('returns 401 for unauthenticated session check', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
