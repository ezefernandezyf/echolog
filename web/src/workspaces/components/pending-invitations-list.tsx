'use client';

import { Button } from '../../shared/components/ui/button';
import { useCancelInvitation } from '../../hooks/use-invitations';
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
  const cancelInvitationMutation = useCancelInvitation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>;
  }

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {invitation.invitedEmail}
            </p>
            <p className="text-xs text-muted-foreground">
              Role: {ROLE_LABELS[invitation.role] ?? invitation.role}
              {' · '}
              Status: {STATUS_LABELS[invitation.status] ?? invitation.status}
            </p>
          </div>

          {invitation.status === 'PENDING' ? (
            <Button
              type="button"
              variant="ghost"
              className="ml-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={cancelInvitationMutation.isPending}
              onClick={() =>
                cancelInvitationMutation.mutate({ workspaceId, invitationId: invitation.id })
              }
            >
              {cancelInvitationMutation.isPending ? '...' : 'Cancel'}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
