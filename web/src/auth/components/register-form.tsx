import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AuthSessionDTO, AuthRegisterDTO } from '../../../../shared/contracts/index.js';
import { authApi, type ApiError } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useAuthStore } from '../auth-store';
import { AUTH_QUERY_KEYS } from '../use-session';

interface RegisterFormProps {
  onSuccess?: (session: AuthSessionDTO) => void;
}

interface RegisterFormState {
  email: string;
  password: string;
  name: string;
}

const INITIAL_REGISTER_FORM_STATE: RegisterFormState = {
  email: '',
  password: '',
  name: '',
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const [formState, setFormState] = useState<RegisterFormState>(INITIAL_REGISTER_FORM_STATE);

  const registerMutation = useMutation<AuthSessionDTO, ApiError, AuthRegisterDTO>({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      onSuccess?.(session);
      setFormState(INITIAL_REGISTER_FORM_STATE);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await registerMutation.mutateAsync({
      email: formState.email,
      password: formState.password,
      name: formState.name || undefined,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Create account</h2>
        <p className="text-sm leading-6 text-zinc-500">
          Start a clean feedback workflow for your team.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="register-name" className="text-sm font-medium text-zinc-900">
          Name
        </label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={formState.name}
          onChange={(event) =>
            setFormState((current) => ({ ...current, name: event.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="register-email" className="text-sm font-medium text-zinc-900">
          Email
        </label>
        <Input
          id="register-email"
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
        <label htmlFor="register-password" className="text-sm font-medium text-zinc-900">
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={formState.password}
          onChange={(event) =>
            setFormState((current) => ({ ...current, password: event.target.value }))
          }
        />
      </div>

      {registerMutation.error ? (
        <p className="text-sm text-red-600">{registerMutation.error.message}</p>
      ) : null}

      <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
