import { cn } from '../../shared/lib/cn';
import { useAuthStore } from '../../auth/auth-store';
import { authApi } from '../../core/api-client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

function getUserInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export interface SidebarItem {
  id: string;
  label: string;
}

interface SidebarProps {
  workspaceName: string;
  items: SidebarItem[];
  activeItemId: string;
  onCreateBoard?: () => void;
  className?: string;
  onNavClick?: () => void;
}

export function Sidebar({
  workspaceName,
  items,
  activeItemId,
  onCreateBoard,
  className,
  onNavClick,
}: SidebarProps) {
  const user = useAuthStore((state) => state.session?.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const userName = user?.name ?? 'Unknown User';
  const userEmail = user?.email ?? '';
  const initials = getUserInitials(user?.name ?? null, userEmail);

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearSession();
      navigate('/login', { replace: true });
    },
  });

  return (
    <aside
      className={cn(
        'flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-background',
        className,
      )}
    >
      <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-card dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-950 dark:text-zinc-100">
              {workspaceName}
            </p>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">⌄</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const active = item.id === activeItemId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={onNavClick}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] transition-colors',
                  active
                    ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
                )}
              >
                {item.label}
                {active ? <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span> : null}
              </button>
            );
          })}
          {onCreateBoard ? (
            <button
              type="button"
              onClick={onCreateBoard}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <span className="text-base leading-none">+</span>
              Create Board
            </button>
          ) : null}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm shadow-zinc-900/[0.02] dark:border-zinc-800 dark:bg-card">
          <div className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-700">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-950 dark:text-zinc-100">
              {userName}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="mt-2 text-xs text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
        >
          {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
