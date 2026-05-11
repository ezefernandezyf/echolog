import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { CreatePostDTO, PostDTO } from '../../../shared/contracts/index.js';

export class PostsService {
  async list(boardId: string): Promise<PostDTO[]> {
    const posts = await prisma.post.findMany({
      where: { boardId },
      include: {
        _count: { select: { votes: true, comments: true } },
      },
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
      commentCount: p._count.comments,
    }));
  }

  async create(boardId: string, input: CreatePostDTO, userId: string): Promise<PostDTO> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: board.workspaceId,
        },
      },
    });
    if (!membership) {
      throw new HttpError('Forbidden', 403);
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
      commentCount: 0,
    };
  }

  async getById(postId: string, userId?: string): Promise<PostDTO> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    if (!post) {
      throw new HttpError('Post not found', 404);
    }

    let isUpvoted = false;
    if (userId) {
      const vote = await prisma.vote.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      isUpvoted = vote !== null;
    }

    return {
      id: post.id,
      workspaceId: post.workspaceId,
      boardId: post.boardId,
      authorId: post.authorId,
      title: post.title,
      body: post.body,
      status: post.status,
      voteCount: post._count.votes,
      commentCount: post._count.comments,
      authorName: post.author.name,
      isUpvoted,
    };
  }

  async updateStatus(postId: string, status: string): Promise<PostDTO> {
    const post = await prisma.post.update({
      where: { id: postId },
      data: { status: status as 'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' },
      include: { _count: { select: { votes: true, comments: true } } },
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
      commentCount: post._count.comments,
    };
  }
}

export const postsService = new PostsService();
