import type { NotificationType } from '@prisma/client';
import { prisma } from '../infra/prisma.js';
import { HttpError } from '../infra/http.js';
import { notificationsService } from '../notifications/notifications.service.js';
import type { CommentDTO, CreateCommentDTO } from '../../../shared/contracts/index.js';

export class CommentsService {
  async list(postId: string): Promise<CommentDTO[]> {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { name: true } },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      authorName: c.author.name,
    }));
  }

  async create(postId: string, input: CreateCommentDTO, userId: string): Promise<CommentDTO> {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, title: true, workspaceId: true },
    });
    if (!post) {
      throw new HttpError('Post not found', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        body: input.body,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    // Notify post author (unless they're commenting on their own post)
    if (post.authorId !== userId) {
      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      notificationsService.create({
        userId: post.authorId,
        type: 'NEW_COMMENT' as NotificationType,
        message: `${commenter?.name ?? 'Someone'} commented on **${post.title}**`,
        link: `/posts/${postId}`,
        actorId: userId,
        workspaceId: post.workspaceId,
      });
    }

    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      authorName: comment.author.name,
    };
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, post: { select: { workspaceId: true } } },
    });

    if (!comment) {
      throw new HttpError('Comment not found', 404);
    }

    // Author can always delete their own comment
    if (comment.authorId === userId) {
      await prisma.comment.delete({ where: { id: commentId } });
      return;
    }

    // Otherwise, must be ADMIN or OWNER of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: comment.post.workspaceId,
        },
      },
    });

    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentsService = new CommentsService();
