'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../../shared/components/ui/button';
import { invitationsApi } from '../../core/api-client';
import type { InvitationDTO } from '../../../../shared/contracts/index.js';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

interface PendingInvitationsListProps {
  workspaceId: string;
  invitations: InvitationDTO[];
  isLoading: boolean;
}

export function PendingInvitationsList({
  workspaceId,
  invitations,
  isLoading,
}: PendingInvitationsListProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.cancel(workspaceId, invitationId),
    onSuccess: () => {
      toast.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['invitations', workspaceId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No pending invitations.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-card"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {invitation.invitedEmail}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Role: {ROLE_LABELS[invitation.role] ?? invitation.role}
              {' · '}
              Status: {STATUS_LABELS[invitation.status] ?? invitation.status}
            </p>
          </div>

          {invitation.status === 'PENDING' ? (
            <Button
              type="button"
              variant="ghost"
              className="ml-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(invitation.id)}
            >
              {cancelMutation.isPending ? '...' : 'Cancel'}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
