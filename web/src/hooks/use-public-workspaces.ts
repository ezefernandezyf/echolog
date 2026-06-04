import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { publicApi } from '../api/public';
import { queryKeys } from './query-keys';
import type { UpdateVisibilityDTO } from '../../../shared/contracts/index.js';

export function usePublicWorkspaces(sort: 'recent' | 'popular' = 'recent') {
  return useQuery({
    queryKey: queryKeys.public.workspaces(sort),
    queryFn: () => publicApi.listWorkspaces(sort),
    staleTime: 30_000,
  });
}

export function usePublicBoard(slug: string, boardSlug: string) {
  return useQuery({
    queryKey: queryKeys.public.boardDetail(slug, boardSlug),
    queryFn: () => publicApi.getBoardBySlug(slug, boardSlug),
    enabled: !!slug && !!boardSlug,
    staleTime: 30_000,
  });
}

export function useUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: UpdateVisibilityDTO }) =>
      publicApi.updateVisibility(workspaceId, data),
    onSuccess: () => {
      toast.success('Workspace visibility updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.public.workspaces() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
    },
  });
}
