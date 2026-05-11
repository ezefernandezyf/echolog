import { prisma } from '../infra/prisma.js';
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
}

export const commentsService = new CommentsService();
