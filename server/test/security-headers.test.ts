import request from 'supertest';
import app from '../src/index.js';

describe('security headers', () => {
  it('sets Content-Security-Policy header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('sets X-Content-Type-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets Referrer-Policy', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('sets Permissions-Policy', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['permissions-policy']).toContain('camera=()');
  });

  it('sets X-Frame-Options to DENY', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });
});
