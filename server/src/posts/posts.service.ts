import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { sanitizeInput } from '../infra/sanitize.js';
import { enforcePublicWriteAccess } from '../infra/public-access.js';
import type {
  CreatePostDTO,
  PostDTO,
  PostListFilters,
  PostListResponse,
} from '../../../shared/contracts/index.js';

interface ListPostsOptions {
  boardId: string;
  userId?: string;
  status?: string;
  search?: string;
  sort?: PostListFilters['sort'];
  cursor?: string;
  limit: number;
}

function mapPost(p: {
  id: string;
  workspaceId: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
  status: string;
  _count: { votes: number; comments: number };
  isUpvoted?: boolean;
}): PostDTO {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    boardId: p.boardId,
    authorId: p.authorId,
    title: p.title,
    body: p.body,
    status: p.status,
    voteCount: p._count.votes,
    commentCount: p._count.comments,
    isUpvoted: p.isUpvoted,
  };
}

export class PostsService {
  async list(opts: ListPostsOptions): Promise<PostListResponse> {
    // Resolve workspaceId via board lookup
    const board = await prisma.board.findUnique({
      where: { id: opts.boardId },
      select: { workspaceId: true },
    });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    const where: Record<string, unknown> = { boardId: opts.boardId };

    if (opts.status) {
      where.status = opts.status;
    }

    if (opts.search?.trim()) {
      where.OR = [{ title: { contains: opts.search } }, { body: { contains: opts.search } }];
    }

    // Cursor-based pagination
    if (opts.cursor) {
      where.id = { lt: opts.cursor };
    }

    // Sort
    let orderBy: Record<string, unknown>;
    switch (opts.sort) {
      case 'top':
        orderBy = { votes: { _count: 'desc' } };
        break;
      case 'new':
        orderBy = { createdAt: 'desc' };
        break;
      case 'trending':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        _count: { select: { votes: true, comments: true } },
      },
      orderBy,
      take: opts.limit + 1, // fetch one extra to determine hasMore
    });

    const upvotedPostIds = opts.userId
      ? new Set(
          (
            await prisma.vote.findMany({
              where: {
                userId: opts.userId,
                postId: { in: posts.map((post) => post.id) },
              },
              select: { postId: true },
            })
          ).map((vote) => vote.postId),
        )
      : new Set<string>();

    const hasMore = posts.length > opts.limit;
    const items = hasMore ? posts.slice(0, opts.limit) : posts;

    return {
      posts: items.map((post) => mapPost({ ...post, isUpvoted: upvotedPostIds.has(post.id) })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async create(boardId: string, input: CreatePostDTO, userId: string): Promise<PostDTO> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    // Check public access level for non-members on PUBLIC workspaces
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: board.workspaceId } },
    });
    if (!membership) {
      await enforcePublicWriteAccess(board.workspaceId, 'CREATE_POST');
    }

    const post = await prisma.post.create({
      data: {
        workspaceId: board.workspaceId,
        boardId,
        authorId: userId,
        title: sanitizeInput(input.title),
        body: sanitizeInput(input.body),
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
