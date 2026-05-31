import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { boardApi } from '../api/boards';
import { queryKeys } from './query-keys';
import type { CreateBoardDTO, UpdateBoardDTO } from '../../../shared/contracts/index.js';

export function useBoards(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.boards.list(workspaceId ?? ''),
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CreateBoardDTO }) =>
      boardApi.create(workspaceId, data),
    onSuccess: (_data, variables) => {
      toast.success('Board created');
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(variables.workspaceId) });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      boardId,
      data,
    }: {
      workspaceId: string;
      boardId: string;
      data: UpdateBoardDTO;
    }) => boardApi.update(workspaceId, boardId, data),
    onSuccess: (_data, variables) => {
      toast.success('Board updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(variables.workspaceId) });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, boardId }: { workspaceId: string; boardId: string }) =>
      boardApi.delete(workspaceId, boardId),
    onSuccess: (_data, variables) => {
      toast.success('Board deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.list(variables.workspaceId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete board');
    },
  });
}
