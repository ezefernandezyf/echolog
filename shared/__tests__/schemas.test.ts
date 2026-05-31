import { describe, it, expect } from 'vitest';
import {
  AuthUserSchema,
  AuthSessionSchema,
  WorkspaceSchema,
  PostSchema,
  WorkspaceRoleSchema,
  InvitationStatusSchema,
  NotificationTypeSchema,
  CreateInvitationDTOSchema,
  UpdateBoardDTOSchema,
  PostListFiltersSchema,
} from '../contracts/schemas.js';
import type { AuthUserDTO, WorkspaceDTO, PostDTO } from '../contracts/schemas.js';

// ===========================================================================
// R1: DTO Zod Schemas — validating DTOs
// ===========================================================================

describe('R1 — DTO Zod Schemas', () => {
  describe('AuthUserSchema', () => {
    const validUser = {
      id: 'user-123',
      email: 'alice@echolog.dev',
      name: 'Alice',
    };

    it('parses valid auth user data', () => {
      const result = AuthUserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('rejects missing id', () => {
      expect(() => AuthUserSchema.parse({ email: 'a@b.com', name: 'A' })).toThrow();
    });

    it('rejects missing email', () => {
      expect(() => AuthUserSchema.parse({ id: 'u1', name: 'A' })).toThrow();
    });

    it('accepts null name', () => {
      const result = AuthUserSchema.parse({ id: 'u1', email: 'a@b.com', name: null });
      expect(result.name).toBeNull();
    });
  });

  describe('AuthSessionSchema', () => {
    const validSession = {
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    };

    it('parses a valid session with nested user', () => {
      const result = AuthSessionSchema.parse(validSession);
      expect(result.user.id).toBe('u1');
      expect(result.user.email).toBe('a@b.com');
      expect(result.user.name).toBe('Alice');
    });

    it('rejects session with missing user id', () => {
      expect(() => AuthSessionSchema.parse({ user: { email: 'a@b.com', name: 'A' } })).toThrow();
    });
  });

  describe('WorkspaceSchema', () => {
    const valid = {
      id: 'ws-1',
      name: 'My Workspace',
      slug: 'my-workspace',
      role: 'OWNER',
    };

    it('parses valid workspace data', () => {
      const result = WorkspaceSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('rejects invalid role value', () => {
      expect(() => WorkspaceSchema.parse({ ...valid, role: 'INVALID_ROLE' })).toThrow();
    });

    it('rejects missing required fields', () => {
      expect(() => WorkspaceSchema.parse({ name: 'No ID' })).toThrow();
    });
  });

  describe('PostSchema', () => {
    const valid = {
      id: 'post-1',
      workspaceId: 'ws-1',
      boardId: 'board-1',
      authorId: 'user-1',
      title: 'My Post',
      body: 'Post body text content',
      status: 'OPEN',
      voteCount: 5,
      commentCount: 2,
    };

    it('parses valid post data', () => {
      const result = PostSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('rejects non-numeric voteCount', () => {
      expect(() => PostSchema.parse({ ...valid, voteCount: 'not-a-number' })).toThrow();
    });

    it('rejects missing required fields', () => {
      expect(() => PostSchema.parse({ id: 'p1', workspaceId: 'ws-1' })).toThrow();
    });

    it('accepts optional fields when present', () => {
      const withOptionals = {
        ...valid,
        authorName: 'Alice',
        isUpvoted: true,
      };
      const result = PostSchema.parse(withOptionals);
      expect(result.authorName).toBe('Alice');
      expect(result.isUpvoted).toBe(true);
    });
  });

  describe('PostListFiltersSchema', () => {
    it('parses a valid filter object with all fields', () => {
      const result = PostListFiltersSchema.parse({
        status: 'OPEN',
        search: 'bug',
        sort: 'trending',
        cursor: 'abc',
        limit: 20,
      });
      expect(result.sort).toBe('trending');
      expect(result.limit).toBe(20);
    });

    it('parses an empty filter object (all optional)', () => {
      const result = PostListFiltersSchema.parse({});
      expect(result.status).toBeUndefined();
      expect(result.sort).toBeUndefined();
    });

    it('rejects invalid sort value', () => {
      expect(() => PostListFiltersSchema.parse({ sort: 'invalid' })).toThrow();
    });
  });
});

// ===========================================================================
// R2: Inferred DTO Types — z.infer type inference
// ===========================================================================

describe('R2 — Inferred DTO Types', () => {
  it('AuthUserDTO type matches AuthUserSchema shape via z.infer', () => {
    // Compile-time check: if the type doesn't match, this won't compile
    const data: AuthUserDTO = { id: 'u1', email: 'a@b.com', name: null };
    const parsed = AuthUserSchema.parse(data);
    expect(parsed).toEqual(data);
  });

  it('WorkspaceDTO type matches WorkspaceSchema shape', () => {
    const data: WorkspaceDTO = {
      id: 'ws-1',
      name: 'Test',
      slug: 'test',
      role: 'ADMIN',
    };
    const parsed = WorkspaceSchema.parse(data);
    expect(parsed).toEqual(data);
  });

  it('PostDTO type matches PostSchema shape', () => {
    const data: PostDTO = {
      id: 'p1',
      workspaceId: 'ws-1',
      boardId: 'b1',
      authorId: 'u1',
      title: 'Title',
      body: 'Body',
      status: 'DONE',
      voteCount: 0,
      commentCount: 0,
    };
    const parsed = PostSchema.parse(data);
    expect(parsed).toEqual(data);
  });

  it('inferred type enforces the correct field types', () => {
    // voteCount and commentCount must be numbers at runtime
    const data: PostDTO = {
      id: 'p1',
      workspaceId: 'ws-1',
      boardId: 'b1',
      authorId: 'u1',
      title: 'T',
      body: 'B',
      status: 'OPEN',
      voteCount: 42,
      commentCount: 7,
    };
    expect(data.voteCount).toBeTypeOf('number');
    expect(data.commentCount).toBeTypeOf('number');
  });
});

// ===========================================================================
// String Enums
// ===========================================================================

describe('String enum schemas', () => {
  describe('WorkspaceRoleSchema', () => {
    const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
    it.each(validRoles)('accepts valid role: %s', (role) => {
      expect(WorkspaceRoleSchema.parse(role)).toBe(role);
    });

    it('rejects invalid role', () => {
      expect(() => WorkspaceRoleSchema.parse('SUPER_ADMIN')).toThrow();
      expect(() => WorkspaceRoleSchema.parse('')).toThrow();
    });
  });

  describe('InvitationStatusSchema', () => {
    const validStatuses = ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'] as const;
    it.each(validStatuses)('accepts valid status: %s', (status) => {
      expect(InvitationStatusSchema.parse(status)).toBe(status);
    });

    it('rejects invalid status', () => {
      expect(() => InvitationStatusSchema.parse('REJECTED')).toThrow();
    });
  });

  describe('NotificationTypeSchema', () => {
    const validTypes = ['INVITE_SENT', 'ROLE_CHANGED', 'NEW_COMMENT'] as const;
    it.each(validTypes)('accepts valid type: %s', (type) => {
      expect(NotificationTypeSchema.parse(type)).toBe(type);
    });

    it('rejects invalid notification type', () => {
      expect(() => NotificationTypeSchema.parse('UNKNOWN_EVENT')).toThrow();
    });
  });
});

// ===========================================================================
// Optional fields
// ===========================================================================

describe('Optional fields in DTO schemas', () => {
  describe('UpdateBoardDTOSchema', () => {
    it('accepts all fields present', () => {
      const result = UpdateBoardDTOSchema.parse({
        name: 'New Name',
        slug: 'new-slug',
        description: 'some description',
      });
      expect(result).toEqual({
        name: 'New Name',
        slug: 'new-slug',
        description: 'some description',
      });
    });

    it('accepts only name provided', () => {
      const result = UpdateBoardDTOSchema.parse({ name: 'Just Name' });
      expect(result.name).toBe('Just Name');
      expect(result.slug).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('accepts empty object (all fields optional)', () => {
      const result = UpdateBoardDTOSchema.parse({});
      expect(result.name).toBeUndefined();
      expect(result.slug).toBeUndefined();
      expect(result.description).toBeUndefined();
    });
  });

  describe('CreateInvitationDTOSchema', () => {
    it('parses with only email (role is optional)', () => {
      const result = CreateInvitationDTOSchema.parse({
        email: 'user@example.com',
      });
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBeUndefined();
    });

    it('parses with email and role', () => {
      const result = CreateInvitationDTOSchema.parse({
        email: 'admin@example.com',
        role: 'ADMIN',
      });
      expect(result.role).toBe('ADMIN');
    });
  });
});
