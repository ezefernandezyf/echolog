import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentApi } from '../api/comments';
import { queryKeys } from './query-keys';
import type { CommentDTO, CreateCommentDTO } from '../../../shared/contracts/index.js';

export function useComments(postId?: string) {
  return useQuery({
    queryKey: queryKeys.comments.list(postId ?? ''),
    queryFn: () => commentApi.list(postId!),
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentDTO }) =>
      commentApi.create(postId, data),
    onSuccess: (_data, variables) => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(variables.postId) });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      commentApi.delete(postId, commentId),
    onMutate: async ({ postId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(postId) });
      const previous = queryClient.getQueryData<CommentDTO[]>(queryKeys.comments.list(postId));
      queryClient.setQueryData<CommentDTO[]>(queryKeys.comments.list(postId), (old) =>
        old ? old.filter((c) => c.id !== commentId) : [],
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Comment deleted');
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.comments.list(variables.postId), context.previous);
      }
      toast.error('Failed to delete comment');
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(variables.postId) });
    },
  });
}
