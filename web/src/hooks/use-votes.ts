import { useMutation } from '@tanstack/react-query';
import { voteApi } from '../api/votes';

export function useVote() {
  return {
    addVote: useMutation({
      mutationFn: (postId: string) => voteApi.addVote(postId),
    }),
    removeVote: useMutation({
      mutationFn: (postId: string) => voteApi.removeVote(postId),
    }),
  };
}
