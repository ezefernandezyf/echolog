'use client';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../shared/components/theme-toggle';
import { PendingInvitationsBell } from '../workspaces/components/pending-invitations-bell';
import { ConfirmDialog } from '../shared/components/ui/confirm-dialog';
import { useAuthStore } from './auth-store';
import { useLogout } from '../hooks/use-auth';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

function getUserInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const user = useAuthStore((state) => state.session?.user);

  const initials = user ? getUserInitials(user.name ?? null, user.email) : '??';

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          id="mobile-hamburger"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary shadow-sm transition-colors hover:bg-muted lg:hidden"
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

        {/* Right side: notification bell + theme toggle + avatar dropdown */}
        <div className="ml-auto flex items-center gap-1">
          <PendingInvitationsBell />
          <ThemeToggle />

          {/* Avatar with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
              aria-label="User menu"
              className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {initials}
            </button>

            {showAvatarDropdown && (
              <>
                {/* Click-outside backdrop */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowAvatarDropdown(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
                  <Link
                    to="/settings"
                    onClick={() => setShowAvatarDropdown(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAvatarDropdown(false);
                      setShowSignOutDialog(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
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
