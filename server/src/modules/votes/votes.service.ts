import { HttpError } from '../../lib/http.js';

const votes = new Set<string>(['post-1:user-1']);

export class VotesService {
  add(postId: string, userId: string) {
    const key = `${postId}:${userId}`;
    if (votes.has(key)) throw new HttpError('Already voted', 409);
    votes.add(key);
    return { postId, userId, voteCount: 1 };
  }

  remove(postId: string, userId: string) {
    votes.delete(`${postId}:${userId}`);
    return { postId, userId, voteCount: 0 };
  }
}

export const votesService = new VotesService();
