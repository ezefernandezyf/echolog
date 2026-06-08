'use client';

import { Button } from '../../shared/components/ui/button';
import { usePendingRequests, useUpdateBoardRequest } from '../../hooks/use-board-requests';
import { toast } from 'sonner';

interface PendingRequestsPanelProps {
  workspaceId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PendingRequestsPanel({ workspaceId }: PendingRequestsPanelProps) {
  const { data: requests, isPending, isError, error } = usePendingRequests(workspaceId);
  const updateMutation = useUpdateBoardRequest(workspaceId);

  if (isPending) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Pending Board Requests</h3>
        <div className="h-16 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Pending Board Requests</h3>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load requests'}
        </p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Pending Board Requests</h3>
        <p className="text-sm text-muted-foreground">No pending board requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Pending Board Requests</h3>
      <ul className="divide-y divide-border" role="list" aria-label="Pending board requests">
        {requests.map((request) => (
          <li key={request.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{request.boardName}</p>
              <p className="text-xs text-muted-foreground">
                {request.userName ?? 'Unknown'} · {formatDate(request.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                onClick={() => {
                  updateMutation.mutate(
                    { requestId: request.id, data: { status: 'APPROVED' } },
                    {
                      onSuccess: () => toast.success(`Board "${request.boardName}" approved`),
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : 'Failed to approve'),
                    },
                  );
                }}
                disabled={updateMutation.isPending}
                className="min-h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  updateMutation.mutate(
                    { requestId: request.id, data: { status: 'REJECTED' } },
                    {
                      onSuccess: () => toast.success(`Board "${request.boardName}" rejected`),
                      onError: (err) =>
                        toast.error(err instanceof Error ? err.message : 'Failed to reject'),
                    },
                  );
                }}
                disabled={updateMutation.isPending}
                className="min-h-8 px-3 text-xs text-destructive hover:text-destructive/90"
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
