import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './auth-store';

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

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const session = useAuthStore((state) => state.session);

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
