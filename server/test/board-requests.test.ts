import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by vitest, must be before any imports
// ---------------------------------------------------------------------------
vi.mock('../src/infra/prisma', () => ({
  prisma: {
    board: {
      findUnique: vi.fn(),
    },
    boardRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../src/infra/sanitize', () => ({
  sanitizeInput: (v: string) => v,
}));

vi.mock('../src/notifications/notifications.service', () => ({
  notificationsService: {
    create: vi.fn(),
  },
}));

vi.mock('../src/boards/boards.service', () => ({
  boardsService: {
    create: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { boardRequestsService } from '../src/boards/board-requests.service';
import { prisma } from '../src/infra/prisma';
import { notificationsService } from '../src/notifications/notifications.service';
import { boardsService } from '../src/boards/boards.service';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockRequest = {
  id: 'req-1',
  workspaceId: 'ws-1',
  userId: 'user-2',
  boardName: 'Feature Requests',
  boardSlug: 'feature-requests',
  status: 'PENDING',
  createdAt: new Date('2025-01-01'),
  user: { name: 'Jane Member' },
};

const mockAdmin = { userId: 'user-1', workspaceId: 'ws-1', role: 'ADMIN', createdAt: new Date() };
const mockOwner = { userId: 'user-3', workspaceId: 'ws-1', role: 'OWNER', createdAt: new Date() };

// ---------------------------------------------------------------------------
// Tests — boardRequestsService.create()
// ---------------------------------------------------------------------------
describe('boardRequestsService.create()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Slug collisions ──────────────────────────────────────────────────

  it('rejects with 409 when slug collides with an existing board', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      id: 'board-1',
      slug: 'feature-requests',
    } as any);
    // BoardRequest check is short-circuited — no pending check needed when board exists

    await expect(
      boardRequestsService.create('ws-1', 'user-2', {
        boardName: 'Feature Requests',
        boardSlug: 'feature-requests',
      }),
    ).rejects.toMatchObject({ message: 'Board slug already exists', statusCode: 409 });

    expect(prisma.boardRequest.create).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('rejects with 409 when slug collides with a pending BoardRequest', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.boardRequest.findFirst).mockResolvedValue(mockRequest as any);

    await expect(
      boardRequestsService.create('ws-1', 'user-2', {
        boardName: 'Feature Requests',
        boardSlug: 'feature-requests',
      }),
    ).rejects.toMatchObject({ message: 'Board slug already requested', statusCode: 409 });

    expect(prisma.boardRequest.create).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('rejects with 409 when same user has a duplicate PENDING for the same slug', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    // First findFirst call: check for ANY pending request with this slug → null (no other user)
    vi.mocked(prisma.boardRequest.findFirst)
      .mockResolvedValueOnce(null) // any user check
      .mockResolvedValueOnce(mockRequest as any); // same user+slug check

    await expect(
      boardRequestsService.create('ws-1', 'user-2', {
        boardName: 'Feature Requests v2',
        boardSlug: 'feature-requests',
      }),
    ).rejects.toMatchObject({ message: 'Duplicate pending request', statusCode: 409 });

    expect(prisma.boardRequest.create).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  // ── Successful creation ──────────────────────────────────────────────

  it('creates PENDING request and notifies workspace admins and owner', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.boardRequest.findFirst).mockResolvedValue(null); // no collision
    vi.mocked(prisma.boardRequest.create).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([mockAdmin, mockOwner] as any);
    vi.mocked(notificationsService.create).mockResolvedValue(undefined as any);

    const result = await boardRequestsService.create('ws-1', 'user-2', {
      boardName: 'Feature Requests',
      boardSlug: 'feature-requests',
    });

    // Returns the created request
    expect(result.id).toBe('req-1');
    expect(result.status).toBe('PENDING');
    expect(result.boardName).toBe('Feature Requests');
    expect(result.boardSlug).toBe('feature-requests');
    expect(result.userName).toBe('Jane Member');

    // BoardRequest created with PENDING status
    expect(prisma.boardRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-2',
          boardName: expect.any(String),
          boardSlug: 'feature-requests',
          status: 'PENDING',
        }),
      }),
    );

    // Notifications fired to admins/owner
    expect(notificationsService.create).toHaveBeenCalledTimes(2);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1', // admin
        type: 'BOARD_REQUEST',
        workspaceId: 'ws-1',
        actorId: 'user-2',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-3', // owner
        type: 'BOARD_REQUEST',
        workspaceId: 'ws-1',
        actorId: 'user-2',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — boardRequestsService.update()
// ---------------------------------------------------------------------------
describe('boardRequestsService.update()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Approve ──────────────────────────────────────────────────────────

  it('approves: creates board, updates status to APPROVED, and notifies requester', async () => {
    vi.mocked(prisma.boardRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(mockAdmin as any);
    vi.mocked(prisma.boardRequest.update).mockResolvedValue({
      ...mockRequest,
      status: 'APPROVED',
    } as any);
    vi.mocked(boardsService.create).mockResolvedValue({
      id: 'new-board-1',
      workspaceId: 'ws-1',
      name: 'Feature Requests',
      slug: 'feature-requests',
      description: null,
    } as any);
    vi.mocked(notificationsService.create).mockResolvedValue(undefined as any);

    const result = await boardRequestsService.update('req-1', 'user-1', { status: 'APPROVED' });

    // Board was created with the requested name via boardsService
    expect(boardsService.create).toHaveBeenCalledWith(
      'ws-1',
      { name: 'Feature Requests', description: null },
      'user-2', // the requester's userId
    );

    // Status updated to APPROVED
    expect(prisma.boardRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: { status: 'APPROVED' },
      }),
    );

    // Notification fired to requester
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        type: 'BOARD_REQUEST',
        message: expect.stringContaining('approved'),
        workspaceId: 'ws-1',
      }),
    );

    expect(result.status).toBe('APPROVED');
  });

  // ── Reject ───────────────────────────────────────────────────────────

  it('rejects: updates status to REJECTED, no board created, and notifies requester', async () => {
    vi.mocked(prisma.boardRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(mockAdmin as any);
    vi.mocked(prisma.boardRequest.update).mockResolvedValue({
      ...mockRequest,
      status: 'REJECTED',
    } as any);
    vi.mocked(notificationsService.create).mockResolvedValue(undefined as any);

    const result = await boardRequestsService.update('req-1', 'user-1', { status: 'REJECTED' });

    // Board NOT created
    expect(boardsService.create).not.toHaveBeenCalled();

    // Status updated to REJECTED
    expect(prisma.boardRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: { status: 'REJECTED' },
      }),
    );

    // Notification fired to requester
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        type: 'BOARD_REQUEST',
        message: expect.stringContaining('rejected'),
        workspaceId: 'ws-1',
      }),
    );

    expect(result.status).toBe('REJECTED');
  });

  // ── Immutable after resolution ───────────────────────────────────────

  it('rejects updates to an already-processed request with 409', async () => {
    vi.mocked(prisma.boardRequest.findUnique).mockResolvedValue({
      ...mockRequest,
      status: 'APPROVED',
    } as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(mockAdmin as any);

    await expect(
      boardRequestsService.update('req-1', 'user-1', { status: 'REJECTED' }),
    ).rejects.toMatchObject({
      message: 'This request has already been processed',
      statusCode: 409,
    });

    expect(prisma.boardRequest.update).not.toHaveBeenCalled();
    expect(boardsService.create).not.toHaveBeenCalled();
  });

  // ── Non-admin/owner cannot update ────────────────────────────────────

  it('rejects when caller is not ADMIN or OWNER of the workspace', async () => {
    vi.mocked(prisma.boardRequest.findUnique).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      userId: 'user-99',
      workspaceId: 'ws-1',
      role: 'MEMBER',
      createdAt: new Date(),
    } as any);

    await expect(
      boardRequestsService.update('req-1', 'user-99', { status: 'APPROVED' }),
    ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });

    expect(prisma.boardRequest.update).not.toHaveBeenCalled();
  });
});
