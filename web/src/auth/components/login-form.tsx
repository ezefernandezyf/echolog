import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import type { AuthSessionDTO, AuthLoginDTO } from '../../../../shared/contracts/index.js';
import { authLoginSchema } from '../../../../shared/contracts/index.js';
import { useLogin } from '../../hooks/use-auth';
import type { ApiError } from '../../api/client';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
import { PageTitle } from '../../core/page-title';
import { AuthCard } from './auth-card';

interface LoginFormProps {
  onSuccess?: (session: AuthSessionDTO) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthLoginDTO>({
    resolver: zodResolver(authLoginSchema),
  });

  const loginMutation = useLogin();

  useFocusOnMount('h2');

  return (
    <AuthCard>
      <PageTitle title="Sign In" />
      <form
        className="space-y-6"
        onSubmit={handleSubmit((data) =>
          loginMutation.mutate(data, { onSuccess: (session) => onSuccess?.(session) }),
        )}
      >
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Sign in to keep collecting feedback in one place.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="login-email-error" role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <p id="login-password-error" role="alert" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {loginMutation.error ? (
          <p className="text-sm text-destructive">
            {(() => {
              const apiErr = loginMutation.error as Partial<ApiError>;
              if (apiErr.status === undefined) return 'Check your connection and try again';
              if (apiErr.status === 401) return 'Invalid email or password';
              return apiErr.message || 'Login failed';
            })()}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          No account yet?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
