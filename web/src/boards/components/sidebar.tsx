import { useEffect, useRef, useState } from 'react';
import { cn } from '../../shared/lib/cn';
import { useAuthStore } from '../../auth/auth-store';
import { useLogout } from '../../hooks/use-auth';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { ThemeToggle } from '../../shared/components/theme-toggle';
import { PendingInvitationsBell } from '../../workspaces/components/pending-invitations-bell';
import { useUiStore } from '../../core/store/ui-store';

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
  workspaceId?: string;
  items: SidebarItem[];
  activeItemId: string;
  onCreateBoard?: () => void;
  onSelectBoard?: (boardId: string) => void;
  className?: string;
  onNavClick?: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sidebar({
  workspaceName,
  workspaceId,
  items,
  activeItemId,
  onCreateBoard,
  onSelectBoard,
  className,
  onNavClick,
}: SidebarProps) {
  const user = useAuthStore((state) => state.session?.user);
  const navigate = useNavigate();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const asideRef = useRef<HTMLElement>(null);
  const userName = user?.name ?? 'Unknown User';
  const userEmail = user?.email ?? '';
  const initials = getUserInitials(user?.name ?? null, userEmail);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Focus trap for mobile sidebar overlay
  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
        document.getElementById('mobile-hamburger')?.focus();
        return;
      }

      if (event.key !== 'Tab' || !asideRef.current) return;

      const focusable = asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element in the sidebar when opened
    const frame = requestAnimationFrame(() => {
      const focusable = asideRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      focusable?.[0]?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [sidebarOpen, closeSidebar]);

  const logoutMutation = useLogout();

  return (
    <aside
      ref={asideRef}
      className={cn(
        'flex w-72 shrink-0 flex-col border-r border-border bg-secondary pt-[env(safe-area-inset-top)] transition-[width] duration-300 ease-in-out',
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <button
          type="button"
          onClick={() => navigate('/w')}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-secondary hover:shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
              {workspaceName}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">←</span>
        </button>
        {workspaceId ? (
          <>
            <Link
              to={`/w/${workspaceId}/members`}
              onClick={onNavClick}
              className="mt-2 flex w-full items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground tracking-[-0.01em] transition-colors hover:border-primary/30 hover:bg-secondary hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0"
              >
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zm14 5a6 6 0 00-6-6h-4a6 6 0 00-6 6v2h16v-2z" />
              </svg>
              <span className="flex-1">Members</span>
            </Link>
            <Link
              to={`/w/${workspaceId}/settings`}
              onClick={onNavClick}
              className="mt-2 flex w-full items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground tracking-[-0.01em] transition-colors hover:border-primary/30 hover:bg-secondary hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">Settings</span>
            </Link>
          </>
        ) : null}
      </div>

      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const active = item.id === activeItemId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectBoard?.(item.id);
                  onNavClick?.();
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] transition-all duration-200',
                  active
                    ? 'border-l-2 border-l-primary bg-muted text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
                {active ? <span className="text-xs text-muted-foreground">•</span> : null}
              </button>
            );
          })}
          {onCreateBoard ? (
            <button
              type="button"
              onClick={onCreateBoard}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <span className="text-base leading-none">+</span>
              Create Board
            </button>
          ) : null}
        </div>
      </nav>

      <div className="border-t border-border px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center gap-2">
          <ThemeToggle />
          <PendingInvitationsBell />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.02] transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center border-t border-border">
            <Link
              to="/settings"
              onClick={onNavClick}
              className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Settings
            </Link>
            <div className="h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setShowSignOutDialog(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
                  clipRule="evenodd"
                />
              </svg>
              Log out
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={showSignOutDialog}
          onClose={() => setShowSignOutDialog(false)}
          onConfirm={() =>
            logoutMutation.mutate(undefined, {
              onSuccess: () => {
                setShowSignOutDialog(false);
                navigate('/login', { replace: true });
              },
            })
          }
          title="Sign out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          variant="danger"
          isLoading={logoutMutation.isPending}
        />
      </div>
    </aside>
  );
}
