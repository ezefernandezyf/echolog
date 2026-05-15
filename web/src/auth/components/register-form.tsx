import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { AuthSessionDTO } from '../../../../shared/contracts/index.js';
import { authRegisterSchema } from '../../../../shared/contracts/index.js';
import { authApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
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
    watch,
    formState: { errors },
  } = useForm<z.input<typeof authRegisterSchema>, undefined, z.output<typeof authRegisterSchema>>({
    resolver: zodResolver(authRegisterSchema),
  });

  const name = watch('name', '');

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      toast.success('Account created');
      setSession(session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      onSuccess?.(session);
    },
  });

  useFocusOnMount('h2');

  return (
    <main id="main-content" className="mx-auto w-full max-w-sm px-4 py-10 sm:py-20">
      <form className="space-y-6" onSubmit={handleSubmit((data) => registerMutation.mutate(data))}>
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Create account
          </h2>
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Start a clean feedback workflow for your team.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-name"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
          >
            Name
          </label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            maxLength={120}
            className="min-h-[44px]"
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          <CharCounter current={name.length} max={120} />
          {errors.name ? (
            <p id="register-name-error" role="alert" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-email"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
          >
            Email
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="min-h-[44px]"
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="register-email-error" role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="register-password"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
          >
            Password
          </label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="min-h-[44px]"
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="register-password-error" role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
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

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
