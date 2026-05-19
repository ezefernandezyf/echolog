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

/** Allows any workspace member (MEMBER, ADMIN, or OWNER). */
export const requireAnyMember = requireWorkspaceMember();

/** Allows only ADMIN or OWNER roles. */
export const requireAdminOrOwner = requireWorkspaceMember(['ADMIN', 'OWNER']);
