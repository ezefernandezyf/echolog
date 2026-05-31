import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { membersApi } from '../api/members';
import { queryKeys } from './query-keys';
import type { WorkspaceRole } from '../../../shared/contracts/index.js';

export function useMembers(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.members.list(workspaceId ?? ''),
    queryFn: () => membersApi.list(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      targetUserId,
      newRole,
    }: {
      workspaceId: string;
      targetUserId: string;
      newRole: WorkspaceRole;
    }) => membersApi.changeRole(workspaceId, targetUserId, newRole),
    onSuccess: (_data, variables) => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(variables.workspaceId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      membersApi.remove(workspaceId, userId),
    onSuccess: (_data, variables) => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(variables.workspaceId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    },
  });
}
