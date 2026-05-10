import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { CreatePostDTO, PostDTO } from '../../../shared/contracts/index.js';

export class PostsService {
  async list(boardId: string): Promise<PostDTO[]> {
    const posts = await prisma.post.findMany({
      where: { boardId },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((p) => ({
      id: p.id,
      workspaceId: p.workspaceId,
      boardId: p.boardId,
      authorId: p.authorId,
      title: p.title,
      body: p.body,
      status: p.status,
      voteCount: p._count.votes,
    }));
  }

  async create(boardId: string, input: CreatePostDTO, userId: string): Promise<PostDTO> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    const post = await prisma.post.create({
      data: {
        workspaceId: board.workspaceId,
        boardId,
        authorId: userId,
        title: input.title,
        body: input.body,
      },
    });

    return {
      id: post.id,
      workspaceId: post.workspaceId,
      boardId: post.boardId,
      authorId: post.authorId,
      title: post.title,
      body: post.body,
      status: post.status,
      voteCount: 0,
    };
  }

  async updateStatus(postId: string, status: string): Promise<PostDTO> {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { status: status as 'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' },
      include: { _count: { select: { votes: true } } },
    });

    return {
      id: post.id,
      workspaceId: post.workspaceId,
      boardId: post.boardId,
      authorId: post.authorId,
      title: post.title,
      body: post.body,
      status: post.status,
      voteCount: post._count.votes,
    };
  }
}

export const postsService = new PostsService();
