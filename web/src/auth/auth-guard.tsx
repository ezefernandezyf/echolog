import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth-store';
import { SessionSkeleton } from '../shared/components/domain-skeletons';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function AuthFallback({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session);

  if (session) {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  // Don't render protected content until we've confirmed the session state
  if (status === 'unknown') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SessionSkeleton />
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const session = useAuthStore((state) => state.session);
  const location = useLocation();

  if (session) {
    // Whitelist: only redirect auth pages — allow landing and /explore for logged-in users
    if (location.pathname === '/login' || location.pathname === '/register') {
      return <Navigate to="/w" replace />;
    }
  }

  return <Outlet />;
}
