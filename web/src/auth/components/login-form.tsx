import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AuthSessionDTO, AuthLoginDTO } from '../../../../shared/contracts/index.js';
import { authApi, type ApiError } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Welcome back</h2>
        <p className="text-sm leading-6 text-zinc-500">
          Sign in to keep collecting feedback in one place.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium text-zinc-900">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={formState.email}
          onChange={(event) =>
            setFormState((current) => ({ ...current, email: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="login-password" className="text-sm font-medium text-zinc-900">
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formState.password}
          onChange={(event) =>
            setFormState((current) => ({ ...current, password: event.target.value }))
          }
        />
      </div>

      {loginMutation.error ? (
        <p className="text-sm text-red-600">{loginMutation.error.message}</p>
      ) : null}

      <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        No account yet?{' '}
        <Link
          to="/register"
          className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
