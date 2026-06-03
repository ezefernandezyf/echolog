import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireWorkspaceMember } from '../src/auth/require-member.middleware.js';
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

describe('requireWorkspaceMember', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
    // Default: PRIVATE workspace
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      visibility: 'PRIVATE',
      publicAccessLevel: 'READ_ONLY',
    } as never);
  });

  it('returns 401 when req.userId is not set', async () => {
    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: undefined });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not a workspace member', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);
    const middleware = requireWorkspaceMember();
    const req = mockReq({ userId: 'user-1' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: workspace member required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user is a workspace member (no role filter)', async () => {
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

  it('returns 403 when member role does not match allowedRoles', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'MEMBER',
    } as never);
    const middleware = requireWorkspaceMember(['ADMIN', 'OWNER']);
    const req = mockReq({ userId: 'user-1' });
    const res = mockRes();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: workspace member required' });
    expect(next).not.toHaveBeenCalled();
  });
});
