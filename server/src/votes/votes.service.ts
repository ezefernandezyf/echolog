import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { VoteDTO } from '../../../shared/contracts/index.js';

export class VotesService {
  async add(postId: string, userId: string): Promise<VoteDTO> {
    const existing = await prisma.vote.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      throw new HttpError('Already voted', 409);
    }

    await prisma.vote.create({ data: { postId, userId } });

    const count = await prisma.vote.count({ where: { postId } });
    return { postId, userId, voteCount: count };
  }

  async remove(postId: string, userId: string): Promise<VoteDTO> {
    await prisma.vote.deleteMany({ where: { postId, userId } });

    const count = await prisma.vote.count({ where: { postId } });
    return { postId, userId, voteCount: count };
  }
}

export const votesService = new VotesService();
