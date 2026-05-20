import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../infra/prisma.js';
import type { WorkspaceRole } from '@prisma/client';

/**
 * Middleware factory that verifies req.userId is a member of the workspace.
 * workspaceId is read from req.params.workspaceId (requires mergeParams: true on the router).
 *
 * @param allowedRoles — optional list of roles to restrict access. If omitted, any membership (MEMBER, ADMIN, OWNER) is allowed.
 * @returns Express middleware that returns 401 if unauthenticated, 403 if not a member, or calls next()
 */
export function requireWorkspaceMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
      }

      const workspaceId = req.params.workspaceId as string;
      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID required' });
        return;
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.userId,
            workspaceId,
          },
        },
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
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Middleware factory that verifies req.userId is a member of the workspace that owns
 * the board identified by req.params.boardId. Resolves workspaceId via board lookup.
 *
 * @param allowedRoles — optional role restriction.
 */
export function requireBoardMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
      }

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

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.userId,
            workspaceId: board.workspaceId,
          },
        },
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
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Middleware factory that verifies req.userId is a member of the workspace that owns
 * the post identified by req.params.postId. Resolves workspaceId via post lookup.
 *
 * @param allowedRoles — optional role restriction.
 */
export function requirePostMember(allowedRoles?: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
      }

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

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.userId,
            workspaceId: post.workspaceId,
          },
        },
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
    } catch {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/** Allows any workspace member (MEMBER, ADMIN, or OWNER). */
export const requireAnyMember = requireWorkspaceMember();

/** Allows only ADMIN or OWNER roles. */
export const requireAdminOrOwner = requireWorkspaceMember(['ADMIN', 'OWNER']);
