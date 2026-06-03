import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../infra/prisma.js';
import type { WorkspaceRole } from '@prisma/client';

/**
 * Check workspace visibility rules.
 *
 * PRIVATE (or null/undefined = default-deny): require auth + membership (existing behavior).
 * PUBLIC + GET: bypass membership entirely.
 * PUBLIC + write (POST/PATCH/PUT/DELETE):
 *   - require auth (401 if anonymous)
 *   - members → bypass (existing behavior)
 *   - non-members → block if READ_ONLY (403), allow if INTERACT/FULL
 *     (service layer enforces per-action access level)
 */
async function checkWorkspaceVisibility(
  req: Request,
  res: Response,
  next: NextFunction,
  workspaceId: string,
  allowedRoles?: WorkspaceRole[],
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { visibility: true, publicAccessLevel: true },
  });
  if (!workspace) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }

  // PRIVATE or default-deny (null/undefined after migration is impossible,
  // but guard against any edge case)
  if (workspace.visibility !== 'PUBLIC') {
    // Existing behavior: require auth + membership
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.userId, workspaceId } },
    });

    if (!membership) {
      res.status(403).json({ error: 'Forbidden: workspace member required' });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      res.status(403).json({ error: 'Forbidden: workspace member required' });
      return;
    }

    next();
    return;
  }

  // PUBLIC workspace
  // GET → bypass membership entirely (anonymous ok)
  if (req.method === 'GET') {
    next();
    return;
  }

  // Write operations (POST/PATCH/PUT/DELETE) on PUBLIC → require auth
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.userId, workspaceId } },
  });

  if (membership) {
    // Member → check role restriction if present
    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      res.status(403).json({ error: 'Forbidden: workspace member required' });
      return;
    }
    next();
    return;
  }

  // Non-member write on PUBLIC workspace → check publicAccessLevel
  if (workspace.publicAccessLevel === 'READ_ONLY') {
    res.status(403).json({ error: 'Forbidden: workspace is read-only for non-members' });
    return;
  }

  // INTERACT or FULL → allow (service enforces per-action at next layer)
  next();
}

/**
 * Middleware factory that verifies req.userId is a member of the workspace.
 * workspaceId is read from req.params.workspaceId (requires mergeParams: true on the router).
 *
 * Now also handles PUBLIC workspace visibility:
 * - PRIVATE workspaces: existing auth + membership behavior
 * - PUBLIC workspaces: GET bypasses membership, writes require auth + tier check
 *
 * @param allowedRoles — optional list of roles to restrict access. If omitted, any membership (MEMBER, ADMIN, OWNER, VIEWER) is allowed.
 * @returns Express middleware
 */
export function requireWorkspaceMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID required' });
        return;
      }

      await checkWorkspaceVisibility(req, res, next, workspaceId, allowedRoles);
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Middleware factory that verifies req.userId is a member of the workspace that owns
 * the board identified by req.params.boardId. Resolves workspaceId via board lookup,
 * then delegates to workspace visibility check.
 *
 * @param allowedRoles — optional role restriction.
 */
export function requireBoardMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId as string;
      if (!boardId) {
        res.status(400).json({ error: 'Board ID required' });
        return;
      }

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { workspaceId: true },
      });

      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      await checkWorkspaceVisibility(req, res, next, board.workspaceId, allowedRoles);
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Middleware factory that verifies req.userId is a member of the workspace that owns
 * the post identified by req.params.postId. Resolves workspaceId via post lookup,
 * then delegates to workspace visibility check.
 *
 * @param allowedRoles — optional role restriction.
 */
export function requirePostMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.postId as string;
      if (!postId) {
        res.status(400).json({ error: 'Post ID required' });
        return;
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { workspaceId: true },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      await checkWorkspaceVisibility(req, res, next, post.workspaceId, allowedRoles);
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/** Allows any workspace member (MEMBER, ADMIN, VIEWER, or OWNER). */
export const requireAnyMember = requireWorkspaceMember();

/** Allows only ADMIN or OWNER roles. */
export const requireAdminOrOwner = requireWorkspaceMember(['ADMIN', 'OWNER']);
