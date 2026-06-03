'use client';

import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../auth/auth-store';
import { Button } from '../shared/components/ui/button';

export function PublicLayout() {
  const session = useAuthStore((state) => state.session);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground"
          >
            EchoLog
          </Link>

          <nav className="flex items-center gap-3">
            {session ? (
              <Button
                variant="outline"
                className="h-9 px-4 text-sm"
                onClick={() => {
                  window.location.href = '/w';
                }}
              >
                Dashboard
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="h-9 px-4 text-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <Outlet />
    </div>
  );
}
