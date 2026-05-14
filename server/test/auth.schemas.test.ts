import {
  authLoginSchema,
  authRegisterSchema,
  createBoardSchema,
  updateWorkspaceSchema,
} from '../../shared/contracts/schemas.js';

describe('auth schemas', () => {
  it('requires a real name during registration', () => {
    const result = authRegisterSchema.safeParse({
      email: 'user@echolog.dev',
      password: 'password123',
      name: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('accepts a valid login payload', () => {
    expect(authLoginSchema.parse({ email: 'user@echolog.dev', password: 'password123' })).toEqual({
      email: 'user@echolog.dev',
      password: 'password123',
    });
  });

  it('rejects punctuation-only slugs with an explicit message', () => {
    const result = updateWorkspaceSchema.safeParse({
      slug: '---',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Slug must include at least one letter or number',
      );
    }
  });

  it('treats blank optional descriptions as omitted', () => {
    const result = createBoardSchema.safeParse({
      name: 'General',
      description: '   ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});
