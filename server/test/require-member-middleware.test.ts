import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requireWorkspaceMember,
  requireBoardMember,
  requirePostMember,
} from '../src/auth/require-member.middleware.js';
import { prisma } from '../src/infra/prisma.js';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../src/infra/prisma.js', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    board: {
      findUnique: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
  },
}));

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    userId: undefined,
    params: { workspaceId: 'ws-1' },
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
}

describe('requireWorkspaceMember — PUBLIC visibility', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('PRIVATE + no auth → 401', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PRIVATE',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: undefined });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('PRIVATE + auth + no member → 403', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PRIVATE',
      publicAccessLevel: 'READ_ONLY',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-1' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: workspace member required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('PRIVATE + auth + member → 200 (calls next)', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PRIVATE',
      publicAccessLevel: 'READ_ONLY',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'MEMBER',
    } as never);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-1' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('PUBLIC + no auth GET → 200 (bypass)', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: undefined, method: 'GET' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('PUBLIC + no auth POST → 401', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: undefined, method: 'POST' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('PUBLIC + auth non-member + READ_ONLY POST → 403', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-2', method: 'POST' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden: workspace is read-only for non-members',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('PUBLIC + auth non-member + INTERACT POST → next (service enforces)', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'INTERACT',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-2', method: 'POST' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('PUBLIC + auth non-member + FULL POST → next (service enforces)', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'FULL',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-2', method: 'POST' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('PUBLIC + auth + member POST → next (bypasses access level)', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'MEMBER',
    } as never);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-1', method: 'POST' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 404 when workspace does not exist', async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-1' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Workspace not found' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireBoardMember — PUBLIC visibility', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('PUBLIC board + no auth GET → 200 (bypass)', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requireBoardMember();
    const req = mockReq({ userId: undefined, method: 'GET', params: { boardId: 'board-1' } });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('PUBLIC board + no auth POST → 401', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requireBoardMember();
    const req = mockReq({ userId: undefined, method: 'POST', params: { boardId: 'board-1' } });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requirePostMember — PUBLIC visibility', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('PUBLIC post + no auth GET → 200 (bypass)', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requirePostMember();
    const req = mockReq({ userId: undefined, method: 'GET', params: { postId: 'post-1' } });
    const res = mockRes();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('PUBLIC post + no auth POST → 401', async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PUBLIC',
      publicAccessLevel: 'READ_ONLY',
    } as never);

    const middleware = requirePostMember();
    const req = mockReq({ userId: undefined, method: 'POST', params: { postId: 'post-1' } });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
