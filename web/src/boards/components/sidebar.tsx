import { cn } from '../../shared/lib/cn';
import { useAuthStore } from '../../auth/auth-store';

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
}

export function Sidebar({ workspaceName, items, activeItemId }: SidebarProps) {
  const user = useAuthStore((state) => state.session?.user);
  const userName = user?.name ?? 'Unknown User';
  const userEmail = user?.email ?? '';
  const initials = getUserInitials(user?.name ?? null, userEmail);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 px-5 py-5">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-950">
              {workspaceName}
            </p>
          </div>
          <span className="text-xs text-zinc-400">⌄</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const active = item.id === activeItemId;

            return (
              <a
                key={item.id}
                href="#"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] transition-colors',
                  active
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
                )}
              >
                {item.label}
                {active ? <span className="text-xs text-zinc-400">•</span> : null}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm shadow-zinc-900/[0.02]">
          <div className="flex size-10 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-zinc-950">
              {userName}
            </p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
