import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { boardRequestsApi } from '../api/board-requests';
import { queryKeys } from './query-keys';
import type { CreateBoardRequestDTO, UpdateBoardRequestDTO } from '../../../shared/contracts/index.js';

export function useCreateBoardRequest(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardRequestDTO) => boardRequestsApi.create(workspaceId, data),
    onSuccess: () => {
      toast.success('Board requested for approval');
      queryClient.invalidateQueries({ queryKey: queryKeys.boardRequests.pending(workspaceId) });
    },
  });
}

export function useUpdateBoardRequest(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: UpdateBoardRequestDTO }) =>
      boardRequestsApi.update(workspaceId, requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boardRequests.pending(workspaceId) });
    },
  });
}

export function usePendingRequests(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.boardRequests.pending(workspaceId),
    queryFn: () => boardRequestsApi.listPending(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}
