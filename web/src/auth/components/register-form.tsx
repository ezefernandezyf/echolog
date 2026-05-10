import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AuthSessionDTO, AuthRegisterDTO } from '../../../../shared/contracts/index.js';
import { authRegisterSchema } from '../../../../shared/contracts/index.js';
import { authApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useAuthStore } from '../auth-store';
import { AUTH_QUERY_KEYS } from '../use-session';

interface RegisterFormProps {
  onSuccess?: (session: AuthSessionDTO) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthRegisterDTO>({
    resolver: zodResolver(authRegisterSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      onSuccess?.(session);
    },
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit((data) => registerMutation.mutate(data))}>
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
          {...register('name')}
        />
        {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
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
          {...register('email')}
        />
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
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
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      {registerMutation.error ? (
        <p className="text-sm text-red-600">
          {registerMutation.error instanceof Error
            ? registerMutation.error.message
            : 'Registration failed'}
        </p>
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
