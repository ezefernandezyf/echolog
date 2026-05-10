import { prisma } from '../infra/prisma.js';
import type { VoteDTO } from '../../../shared/contracts/index.js';

export interface ToggleVoteResult extends VoteDTO {
  voted: boolean;
}

export class VotesService {
  async toggle(postId: string, userId: string): Promise<ToggleVoteResult> {
    const existing = await prisma.vote.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.vote.delete({ where: { postId_userId: { postId, userId } } });
      const count = await prisma.vote.count({ where: { postId } });
      return { postId, userId, voteCount: count, voted: false };
    }

    await prisma.vote.create({ data: { postId, userId } });
    const count = await prisma.vote.count({ where: { postId } });
    return { postId, userId, voteCount: count, voted: true };
  }
}

export const votesService = new VotesService();
