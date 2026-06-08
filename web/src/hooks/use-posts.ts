import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postApi } from '../api/posts';
import { queryKeys } from './query-keys';
import type { CreatePostDTO, PostListFilters } from '../../../shared/contracts/index.js';

export function usePost(postId?: string) {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId ?? ''),
    queryFn: () => postApi.getById(postId!),
    enabled: !!postId,
  });
}

export function usePosts(boardId?: string, filters?: PostListFilters) {
  return useQuery({
    queryKey: queryKeys.posts.list(boardId ?? '', filters ?? {}),
    queryFn: () => postApi.list(boardId!, filters),
    enabled: !!boardId,
  });
}

export function useInfinitePosts(
  boardId?: string | null,
  options?: {
    status?: string | null;
    sort?: 'trending' | 'top' | 'new';
    pageSize?: number;
  },
) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(boardId ?? '', {
      status: options?.status ?? undefined,
      sort: options?.sort,
    }),
    queryFn: async ({ pageParam }) =>
      postApi.list(boardId!, {
        status: options?.status ?? undefined,
        sort: options?.sort,
        cursor: (pageParam as string | null) ?? undefined,
        limit: options?.pageSize ?? 20,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: (previousData) => previousData,
    enabled: !!boardId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: CreatePostDTO }) =>
      postApi.create(boardId, data),
    onSuccess: (_data, variables) => {
      toast.success('Post created');
      queryClient.invalidateQueries({ queryKey: ['posts', variables.boardId] });
    },
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      postId,
      status,
    }: {
      boardId: string;
      postId: string;
      status: string;
    }) => postApi.updateStatus(boardId, postId, status),
    onSuccess: (_data, variables) => {
      toast.success(`Post status changed to ${variables.status.replace('_', ' ')}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list(variables.boardId) });
    },
    onError: () => {
      toast.error('Failed to update status.');
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: { boardId: string; postId: string }) =>
      postApi.deletePost(postId),
    onMutate: async ({ boardId, postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts', boardId] });
      const previous = queryClient.getQueryData(['posts', boardId]);
      queryClient.setQueryData(['posts', boardId], (old: unknown) =>
        Array.isArray(old) ? old.filter((p: { id: string }) => p.id !== postId) : [],
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Post deleted');
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['posts', variables.boardId], context.previous);
      }
      toast.error('Failed to delete post');
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts', variables.boardId] });
    },
  });
}
