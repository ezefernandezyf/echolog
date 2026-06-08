import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by vitest, must be before any imports
// ---------------------------------------------------------------------------
vi.mock('../src/infra/prisma', () => ({
  prisma: {
    board: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../src/infra/public-access', () => ({
  enforcePublicWriteAccess: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { boardsService } from '../src/boards/boards.service';
import { prisma } from '../src/infra/prisma';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
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

const makeMember = (role: string) => ({
  userId: 'user-1',
  workspaceId: 'ws-1',
  role,
  createdAt: new Date(),
});

const mockBoard = {
  id: 'board-1',
  workspaceId: 'ws-1',
  name: 'Test Board',
  slug: 'test-board',
  description: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('boardsService.create() — permission gating', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Default behavior (FREE + boardCreation=MEMBERS) ─────────────────

  it('allows MEMBER to create when boardCreationPolicy=FREE and boardCreation=MEMBERS (default)', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null); // no slug collision
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(makeWorkspace() as any);
    vi.mocked(prisma.board.create).mockResolvedValue(mockBoard as any);

    const result = await boardsService.create('ws-1', { name: 'Test Board' }, 'user-1');

    expect(result.id).toBe('board-1');
    expect(result.name).toBe('Test Board');
  });

  it('blocks VIEWER when boardCreation=MEMBERS (FREE policy, default field)', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('VIEWER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(makeWorkspace() as any);

    await expect(
      boardsService.create('ws-1', { name: 'Test Board' }, 'user-1'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.board.create).not.toHaveBeenCalled();
  });

  // ── ADMINS_ONLY policy ──────────────────────────────────────────────

  it('blocks MEMBER when boardCreationPolicy=ADMINS_ONLY', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardCreationPolicy: 'ADMINS_ONLY' }) as any,
    );

    await expect(
      boardsService.create('ws-1', { name: 'Test Board' }, 'user-1'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.board.create).not.toHaveBeenCalled();
  });

  it('allows ADMIN to create when boardCreationPolicy=ADMINS_ONLY', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('ADMIN') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardCreationPolicy: 'ADMINS_ONLY' }) as any,
    );
    vi.mocked(prisma.board.create).mockResolvedValue(mockBoard as any);

    const result = await boardsService.create('ws-1', { name: 'Test Board' }, 'user-1');

    expect(result.id).toBe('board-1');
  });

  it('allows OWNER to create when boardCreationPolicy=ADMINS_ONLY', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('OWNER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardCreationPolicy: 'ADMINS_ONLY' }) as any,
    );
    vi.mocked(prisma.board.create).mockResolvedValue(mockBoard as any);

    const result = await boardsService.create('ws-1', { name: 'Test Board' }, 'user-1');

    expect(result.id).toBe('board-1');
  });

  // ── APPROVAL_REQUIRED policy ────────────────────────────────────────

  it('blocks MEMBER when boardCreationPolicy=APPROVAL_REQUIRED (must use board-requests)', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardCreationPolicy: 'APPROVAL_REQUIRED' }) as any,
    );

    await expect(
      boardsService.create('ws-1', { name: 'Test Board' }, 'user-1'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.board.create).not.toHaveBeenCalled();
  });

  // ── boardCreation=ADMINS under FREE policy ──────────────────────────

  it('blocks MEMBER when boardCreationPolicy=FREE but boardCreation=ADMINS', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('MEMBER') as any);
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardCreationPolicy: 'FREE', boardCreation: 'ADMINS' }) as any,
    );

    await expect(
      boardsService.create('ws-1', { name: 'Test Board' }, 'user-1'),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.board.create).not.toHaveBeenCalled();
  });
});

describe('boardsService.delete() — permission gating', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('allows ADMIN to delete when boardDeletion=ADMINS (default)', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      id: 'board-1',
      workspaceId: 'ws-1',
    } as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('ADMIN') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardDeletion: 'ADMINS' }) as any,
    );
    vi.mocked(prisma.board.delete).mockResolvedValue({} as any);

    await expect(boardsService.delete('board-1', 'user-1')).resolves.toBeUndefined();

    expect(prisma.board.delete).toHaveBeenCalledWith({ where: { id: 'board-1' } });
  });

  it('blocks ADMIN when boardDeletion=OWNER', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      id: 'board-1',
      workspaceId: 'ws-1',
    } as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(makeMember('ADMIN') as any);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(
      makeWorkspace({ boardDeletion: 'OWNER' }) as any,
    );

    await expect(boardsService.delete('board-1', 'user-1')).rejects.toMatchObject({
      message: 'Forbidden',
      statusCode: 403,
    });

    expect(prisma.board.delete).not.toHaveBeenCalled();
  });
});
