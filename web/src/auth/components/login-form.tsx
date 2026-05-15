import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { AuthSessionDTO, AuthLoginDTO } from '../../../../shared/contracts/index.js';
import { authLoginSchema } from '../../../../shared/contracts/index.js';
import { authApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
import { useAuthStore } from '../auth-store';
import { AUTH_QUERY_KEYS } from '../use-session';

interface LoginFormProps {
  onSuccess?: (session: AuthSessionDTO) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthLoginDTO>({
    resolver: zodResolver(authLoginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      toast.success('Welcome back');
      setSession(session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      onSuccess?.(session);
    },
  });

  useFocusOnMount('h2');

  return (
    <main id="main-content" className="mx-auto w-full max-w-sm px-4 py-10 sm:py-20">
      <form className="space-y-6" onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back
          </h2>
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Sign in to keep collecting feedback in one place.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
          >
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="min-h-[44px]"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="login-email-error" role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
          >
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="min-h-[44px]"
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="login-password-error" role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {loginMutation.error ? (
          <p className="text-sm text-red-600">
            {loginMutation.error instanceof Error ? loginMutation.error.message : 'Login failed'}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account yet?{' '}
          <Link
            to="/register"
            className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
