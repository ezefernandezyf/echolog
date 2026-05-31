import { fetchJson } from './client';

export const voteApi = {
  addVote: (postId: string) =>
    fetchJson<{ postId: string; userId: string; voteCount: number; voted: boolean }>({
      url: `/posts/${postId}/vote`,
      method: 'POST',
    }),
  removeVote: (postId: string) =>
    fetchJson<{ postId: string; userId: string; voteCount: number; voted: boolean }>({
      url: `/posts/${postId}/vote`,
      method: 'DELETE',
    }),
};
