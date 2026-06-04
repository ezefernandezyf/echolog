'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../shared/components/theme-toggle';
import { ConfirmDialog } from '../shared/components/ui/confirm-dialog';
import { useAuthStore } from './auth-store';
import { useLogout } from '../hooks/use-auth';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

export function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const user = useAuthStore((state) => state.session?.user);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          id="mobile-hamburger"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary shadow-sm transition-colors hover:bg-muted"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 text-secondary-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <Link to="/w" className="font-semibold tracking-tight text-foreground">
          EchoLog
        </Link>

        {/* Right side: Theme toggle + Settings + Profile + Logout */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={() => setShowSignOutDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            Log out
          </button>
          {user ? (
            <div className="ml-1 text-xs text-muted-foreground hidden sm:block">
              {user.name ?? user.email}
            </div>
          ) : null}
        </div>
      </header>

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
    </>
  );
}
