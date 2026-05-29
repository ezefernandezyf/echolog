'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../../core/api-client';

function NotificationIcon({ type }: { type: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
      {type === 'INVITE_SENT' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-info">
          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
        </svg>
      ) : type === 'ROLE_CHANGED' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-warning">
          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-success">
          <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.5v2.719c0 1.226.683 2.348 1.762 2.912l-1.784 2.23A.75.75 0 006 16.25v-3.674a7.303 7.303 0 01-1.571-.7A3.366 3.366 0 013 8.5V5.677c0-1.002.69-1.87 1.658-2.097.224-.052.456-.107.695-.162l.087-.02c.13-.03.26-.058.39-.085l.072-.017A38.48 38.48 0 019 2.5c.9 0 1.795.054 2.68.16.285.034.57.071.851.113.064.01.128.02.191.031l.083.014c.414.073.83.16 1.242.26.08.02.16.04.24.059.164.04.327.082.488.127.214.06.426.124.634.197l-.086-.332c-.008-.03-.018-.06-.027-.09.432.144.853.32 1.254.527l.084.042c.12.06.238.122.354.186.124.069.245.142.363.219l.075.05c.2.136.394.28.58.432.057.047.114.095.17.144l.078.07c.276.252.53.528.759.826l.069.092c.165.218.317.447.455.684l.019.034c.1.171.19.347.27.527.082.183.154.37.214.56l.024.072a7.48 7.48 0 01.104.345l.018.07c.046.186.083.376.11.569l.016.07c.047.346.07.7.07 1.062v1.48c0 1.047-.46 2.03-1.228 2.712A2.262 2.262 0 0117.5 14.25v.194c0 .646-.324 1.233-.82 1.662a.75.75 0 01-1.1-.096l-1.786-2.231A3.366 3.366 0 0112.5 11.22V8.5c0-1.773-1.729-3.804-3.652-3.947a43.928 43.928 0 00-4.115-.28c-.458 0-.91.013-1.356.038l-.22.013c-.15.009-.3.02-.447.032A2.333 2.333 0 003 5.676v2.823c0 1.047.46 2.03 1.228 2.712l-.033.15A2.26 2.26 0 014 11.22V8.5c0-.646.324-1.233.82-1.662a.75.75 0 011.1.096l1.786 2.232z" />
        </svg>
      )}
    </span>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: notificationsApi.list,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Notifications
          </h1>
          {unread > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {unread} unread
            </p>
          ) : null}
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => markAllAsReadMutation.mutate()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-colors ${
                notif.read
                  ? 'bg-card'
                  : 'bg-info/30'
              }`}
            >
              <NotificationIcon type={notif.type} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${notif.read ? 'text-secondary-foreground' : 'font-medium text-foreground'}`}>
                  {notif.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {notif.link ? (
                  <Link
                    to={notif.link}
                    onClick={() => {
                      if (!notif.read) markAsReadMutation.mutate(notif.id);
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
                  >
                    View
                  </Link>
                ) : null}
                {!notif.read ? (
                  <button
                    type="button"
                    onClick={() => markAsReadMutation.mutate(notif.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
