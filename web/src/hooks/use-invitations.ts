import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invitationsApi } from '../api/invitations';
import { queryKeys } from './query-keys';

export function useInvitations(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.invitations.list(workspaceId ?? ''),
    queryFn: () => invitationsApi.listPending(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.pending,
    queryFn: () => invitationsApi.listMine(),
    refetchInterval: 30_000,
  });
}

export function useInvitation(token?: string) {
  return useQuery({
    queryKey: queryKeys.invitations.detail(token ?? ''),
    queryFn: () => invitationsApi.getByToken(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role?: import('../../../shared/contracts/index.js').WorkspaceRole;
    }) => invitationsApi.create(workspaceId, { email, role }),
    onSuccess: (_data, variables) => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.list(variables.workspaceId),
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationsApi.accept(token),
    onSuccess: () => {
      toast.success('You have joined the workspace!');
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationsApi.decline(token),
    onSuccess: () => {
      toast.success('Invitation declined');
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.pending });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to decline invitation');
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      invitationsApi.cancel(workspaceId, invitationId),
    onSuccess: (_data, variables) => {
      toast.success('Invitation cancelled');
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.list(variables.workspaceId),
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    },
  });
}
