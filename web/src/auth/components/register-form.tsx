import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionDTO, AuthRegisterDTO } from '../../../../shared/contracts/index.js';
import { authApi, type ApiError } from '../../core/api-client';
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
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <label>
        Name
        <input
          type="text"
          value={formState.name}
          onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
        />
      </label>
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
      <button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
      </button>
      {registerMutation.error ? <p>{registerMutation.error.message}</p> : null}
    </form>
  );
}
