import { loginAuthSchema, registerAuthSchema } from '../../shared/types/auth.js';

describe('auth schemas', () => {
  it('rejects an invalid registration payload', () => {
    expect(() => registerAuthSchema.parse({ email: 'bad', password: 'short' })).toThrow();
  });

  it('accepts a valid login payload', () => {
    expect(loginAuthSchema.parse({ email: 'user@echolog.dev', password: 'password123' })).toEqual({
      email: 'user@echolog.dev',
      password: 'password123',
    });
  });
});
