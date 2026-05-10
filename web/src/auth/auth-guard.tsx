import type { ReactNode } from 'react';
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
