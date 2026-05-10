import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionDTO, AuthLoginDTO } from '../../../../shared/contracts/index.js';
import { authApi, type ApiError } from '../../core/api-client';
import { useAuthStore } from '../auth-store';
import { AUTH_QUERY_KEYS } from '../use-session';

interface LoginFormProps {
  onSuccess?: (session: AuthSessionDTO) => void;
}

interface LoginFormState {
  email: string;
  password: string;
}

const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  email: '',
  password: '',
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_LOGIN_FORM_STATE);

  const loginMutation = useMutation<AuthSessionDTO, ApiError, AuthLoginDTO>({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      onSuccess?.(session);
      setFormState(INITIAL_LOGIN_FORM_STATE);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginMutation.mutateAsync(formState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <label>
        Email
        <input
          type="email"
          value={formState.email}
          onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={formState.password}
          onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
        />
      </label>
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </button>
      {loginMutation.error ? <p>{loginMutation.error.message}</p> : null}
    </form>
  );
}
