import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workspaceApi } from '../api/workspaces';
import { queryKeys } from './query-keys';
import type { CreateWorkspaceDTO, UpdateWorkspaceDTO } from '../../../shared/contracts/index.js';

export function useWorkspaces(userId?: string) {
  return useQuery({
    queryKey: queryKeys.workspaces.list(userId),
    queryFn: () => workspaceApi.list(),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspaceDTO) => workspaceApi.create(data),
    onSuccess: () => {
      toast.success('Workspace created');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: UpdateWorkspaceDTO }) =>
      workspaceApi.update(workspaceId, data),
    onSuccess: () => {
      toast.success('Workspace updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.delete(workspaceId),
    onSuccess: () => {
      toast.success('Workspace deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete workspace');
    },
  });
}
