import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by vitest, must be before any imports
// ---------------------------------------------------------------------------
vi.mock('../src/infra/prisma', () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../src/infra/public-access', () => ({
  enforcePublicWriteAccess: vi.fn(),
}));

vi.mock('../src/notifications/notifications.service', () => ({
  notificationsService: { create: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { commentsService } from '../src/comments/comments.service';
import { prisma } from '../src/infra/prisma';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  authorId: 'user-1',
  title: 'Test Post',
  workspaceId: 'ws-1',
  ...overrides,
});

const makeMember = (role: string) => ({
  userId: 'user-1',
  workspaceId: 'ws-1',
  role,
  createdAt: new Date(),
});

const makeWorkspace = (overrides: Record<string, unknown> = {}) => ({
  id: 'ws-1',
  name: 'Test Workspace',
  slug: 'test-workspace',
  boardCreation: 'MEMBERS',
  boardDeletion: 'ADMINS',
  commenting: 'MEMBERS',
  boardCreationPolicy: 'FREE',
  ...overrides,
});

const mockComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-1',
  body: 'Test comment',
  createdAt: new Date(),
  author: { name: 'Test User' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('commentsService.create() — permission gating', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows MEMBER to comment when commenting=MEMBERS (default)', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(makePost() as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ commenting: 'MEMBERS' }) as any,
    );
    vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as any);
    // Self-comment: authorId matches userId, no notification/user lookup
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', name: 'Test User' } as any);

    const result = await commentsService.create('post-1', { body: 'Test comment' }, 'user-1');

    expect(result.id).toBe('comment-1');
    expect(result.body).toBe('Test comment');
  });

  it('blocks MEMBER when commenting=NOBODY (only owner bypasses)', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(makePost() as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ commenting: 'NOBODY' }) as any,
    );

    await expect(
      commentsService.create('post-1', { body: 'Should fail' }, 'user-1'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it('allows OWNER to comment when commenting=NOBODY (owner always bypasses)', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(makePost({ authorId: 'user-2' }) as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('OWNER') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ commenting: 'NOBODY' }) as any,
    );
    vi.mocked(prisma.comment.create).mockResolvedValue({
      ...mockComment,
      authorId: 'user-1',
      author: { name: 'Owner' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1', name: 'Owner' } as any);

    const result = await commentsService.create('post-1', { body: 'Owner override' }, 'user-1');

    expect(result.id).toBe('comment-1');
  });

  it('blocks ADMIN when commenting=NOBODY (only owner bypasses NOBODY)', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(makePost() as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('ADMIN') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ commenting: 'NOBODY' }) as any,
    );

    await expect(
      commentsService.create('post-1', { body: 'Admin tries' }, 'user-2'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
