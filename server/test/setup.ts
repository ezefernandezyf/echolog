import { beforeEach } from 'vitest';

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'echolog-test-secret-000000000';
});
