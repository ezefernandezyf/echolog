import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionDTO } from '../../../shared/contracts/index.js';
import { authApi, type ApiError } from '../core/api-client';
import { useAuthStore } from './auth-store';

const AUTH_QUERY_KEYS = {
  session: ['auth', 'session'] as const,
} as const;

export function useSession() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const sessionQuery = useQuery<AuthSessionDTO, ApiError>({
    queryKey: AUTH_QUERY_KEYS.session,
    queryFn: () => authApi.me(),
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setSession(sessionQuery.data);
    }
  }, [setSession, sessionQuery.data]);

  useEffect(() => {
    if (sessionQuery.isError) {
      clearSession();
      queryClient.clear();
    }
  }, [clearSession, queryClient, sessionQuery.isError]);

  return sessionQuery;
}

export { AUTH_QUERY_KEYS };
