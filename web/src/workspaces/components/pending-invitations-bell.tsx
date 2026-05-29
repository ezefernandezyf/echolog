'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { invitationsApi, notificationsApi } from '../../core/api-client';

export function PendingInvitationsBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: invitationsApi.listMine,
    refetchInterval: 30_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.listUnread,
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (token: string) => invitationsApi.accept(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setOpen(false);
      navigate(`/w/${data.workspaceId}`);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (token: string) => invitationsApi.decline(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const totalCount = invitations.length + notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${totalCount > 0 ? ` (${totalCount})` : ''}`}
        className="relative flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {totalCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold leading-none text-white ring-2 ring-card">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-80 animate-fade-in rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="inline-flex items-center py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mark all as read
                </button>
              ) : null}
            </div>

            {/* System Notifications */}
            {notifications.length > 0 ? (
              <div className="max-h-48 space-y-0.5 overflow-y-auto px-2 py-2">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      markAsReadMutation.mutate(notif.id);
                      setOpen(false);
                      if (notif.link) navigate(notif.link);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <span className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {notif.message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Separator */}
            {notifications.length > 0 && invitations.length > 0 ? (
              <div className="border-t border-border" />
            ) : null}

            {/* Pending Invitations */}
            {invitations.length > 0 ? (
              <div className="max-h-48 space-y-1 overflow-y-auto px-2 py-2">
                <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Pending Invitations
                </p>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-border bg-secondary px-3 py-2.5"
                  >
                    <div className="mb-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {inv.workspaceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invited as{' '}
                        <span className="font-medium uppercase tracking-wide text-secondary-foreground">
                          {inv.role}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => acceptMutation.mutate(inv.token)}
                        disabled={acceptMutation.isPending}
                        className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {acceptMutation.isPending ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => declineMutation.mutate(inv.token)}
                        disabled={declineMutation.isPending}
                        className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Empty state */}
            {totalCount === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : null}

            <div className="border-t border-border px-4 py-2.5">
              <Link
                to="/notifications"
                className="block py-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
