import { prisma } from '../infra/prisma.js';
import { HttpError } from '../infra/http.js';
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
      select: { id: true },
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
      include: {
        post: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new HttpError('Comment not found', 404);
    }

    const isAuthor = comment.authorId === userId;
    const isWorkspaceOwnerOrAdmin = comment.post.workspace.members.some(
      (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
    );

    if (!isAuthor && !isWorkspaceOwnerOrAdmin) {
      throw new HttpError('Forbidden', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentsService = new CommentsService();
