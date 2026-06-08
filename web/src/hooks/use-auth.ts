import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../auth/auth-store';
import { queryKeys } from './query-keys';
import type {
  AuthLoginDTO,
  AuthRegisterDTO,
  AuthSessionDTO,
  UpdateProfileDTO,
  UpdateEmailDTO,
  UpdatePasswordDTO,
} from '../../../shared/contracts/index.js';

export const AUTH_QUERY_KEYS = queryKeys.auth;

export function useSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const sessionQuery = useQuery<AuthSessionDTO, ApiError>({
    queryKey: queryKeys.auth.session,
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
    }
  }, [clearSession, sessionQuery.isError]);

  return sessionQuery;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: AuthLoginDTO) => authApi.login(data),
    onSuccess: (session) => {
      queryClient.clear();
      toast.success('Welcome back');
      setSession(session);
      queryClient.setQueryData(queryKeys.auth.session, session);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: AuthRegisterDTO) => authApi.register(data),
    onSuccess: (session) => {
      queryClient.clear();
      toast.success('Account created');
      setSession(session);
      queryClient.setQueryData(queryKeys.auth.session, session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileDTO) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Display name updated');
    },
  });
}

export function useUpdateEmail() {
  return useMutation({
    mutationFn: (data: UpdateEmailDTO) => authApi.updateEmail(data),
    onSuccess: () => {
      toast.success('Email updated');
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: UpdatePasswordDTO) => authApi.updatePassword(data),
    onSuccess: () => {
      toast.success('Password changed');
    },
  });
}
