import request from 'supertest';
import app from '../src/index.js';

describe('auth routes', () => {
  it('validates registration payloads', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'bad', password: '123' });
    expect(response.status).toBe(400);
  });
});
