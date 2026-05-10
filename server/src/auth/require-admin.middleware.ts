import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../infra/prisma.js';

export async function requireWorkspaceAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthenticated' });
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

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Forbidden: admin access required' });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
