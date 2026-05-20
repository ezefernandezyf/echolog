import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { VoteDTO } from '../../../shared/contracts/index.js';

export interface VoteResult extends VoteDTO {
  voted: boolean;
}

export class VotesService {
  async addVote(postId: string, userId: string): Promise<VoteResult> {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new HttpError('Post not found', 404);
    }

    const existing = await prisma.vote.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      throw new HttpError('Already voted', 409);
    }

    await prisma.vote.create({ data: { postId, userId } });
    const count = await prisma.vote.count({ where: { postId } });
    return { postId, userId, voteCount: count, voted: true };
  }

  async removeVote(postId: string, userId: string): Promise<VoteResult> {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      throw new HttpError('Post not found', 404);
    }

    const existing = await prisma.vote.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (!existing) {
      // Not voted — return current state silently (200, not 404)
      const count = await prisma.vote.count({ where: { postId } });
      return { postId, userId, voteCount: count, voted: false };
    }

    await prisma.vote.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.vote.count({ where: { postId } });
    return { postId, userId, voteCount: count, voted: false };
  }
}

export const votesService = new VotesService();
