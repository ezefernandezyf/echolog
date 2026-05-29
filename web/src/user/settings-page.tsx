'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '../shared/components/ui/button';
import { Input } from '../shared/components/ui/input';
import { CharCounter } from '../shared/components/ui/char-counter';
import { mapServerErrors } from '../shared/lib/map-server-errors';
import { authApi } from '../core/api-client';
import { useAuthStore } from '../auth/auth-store';
import { PageTitle } from '../core/page-title';
import {
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from '../../../shared/contracts/index.js';
import type {
  UpdateProfileDTO,
  UpdateEmailDTO,
  UpdatePasswordDTO,
} from '../../../shared/contracts/index.js';

export function UserSettingsPage() {
  const user = useAuthStore((state) => state.session?.user);
  const patchUser = useAuthStore((state) => state.patchUser);

  // --- Profile form ---
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    watch: watchProfile,
    reset: resetProfile,
    setError: setProfileError,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<z.input<typeof updateProfileSchema>, undefined, z.output<typeof updateProfileSchema>>(
    {
      resolver: zodResolver(updateProfileSchema),
      values: user?.name ? { name: user.name } : undefined,
    },
  );

  const profileName = (watchProfile('name', '') as string) ?? '';

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileDTO) => authApi.updateProfile(data),
    onSuccess: (data) => {
      patchUser({ name: data.user.name ?? undefined });
      resetProfile({ name: data.user.name ?? undefined });
      toast.success('Display name updated');
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setProfileError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  // --- Email form ---
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    setError: setEmailError,
    formState: { errors: emailErrors, isDirty: emailDirty },
  } = useForm<z.input<typeof updateEmailSchema>, undefined, z.output<typeof updateEmailSchema>>({
    resolver: zodResolver(updateEmailSchema),
    values: user?.email ? { email: user.email, currentPassword: '' } : undefined,
  });

  const emailMutation = useMutation({
    mutationFn: (data: UpdateEmailDTO) => authApi.updateEmail(data),
    onSuccess: (data) => {
      patchUser({ email: data.user.email });
      resetEmail({ email: data.user.email, currentPassword: '' });
      toast.success('Email updated');
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setEmailError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  // --- Password form ---
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isDirty: passwordDirty },
  } = useForm<
    z.input<typeof updatePasswordSchema>,
    undefined,
    z.output<typeof updatePasswordSchema>
  >({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: UpdatePasswordDTO) => authApi.updatePassword(data),
    onSuccess: () => {
      resetPassword();
      toast.success('Password changed');
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setPasswordError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-8 animate-fade-in">
      <PageTitle title="Settings" />

      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            to="/w"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Workspaces
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground" aria-current="page">
            Settings
          </span>
        </nav>

        {/* Section 1: Profile */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Display Name</h2>
            <p className="text-sm text-muted-foreground">
              This is the name shown across the app.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleProfileSubmit((data) => profileMutation.mutate(data))}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">Name</span>
              <Input
                id="profile-name"
                placeholder="Your name"
                autoComplete="name"
                maxLength={120}
                aria-describedby={profileErrors.name ? 'profile-name-error' : undefined}
                aria-invalid={profileErrors.name ? true : undefined}
                {...registerProfile('name')}
              />
              <CharCounter current={profileName.length} max={120} />
              {profileErrors.name ? (
                <p id="profile-name-error" role="alert" className="text-sm text-destructive">
                  {profileErrors.name.message}
                </p>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" disabled={profileMutation.isPending || !profileDirty}>
                {profileMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </section>

        {/* Section 2: Email */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Email</h2>
            <p className="text-sm text-muted-foreground">
              Change the email address you use to sign in.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleEmailSubmit((data) => emailMutation.mutate(data))}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                New Email
              </span>
              <Input
                id="settings-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-describedby={emailErrors.email ? 'settings-email-error' : undefined}
                aria-invalid={emailErrors.email ? true : undefined}
                {...registerEmail('email')}
              />
              {emailErrors.email ? (
                <p id="settings-email-error" role="alert" className="text-sm text-destructive">
                  {emailErrors.email.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                Current Password
              </span>
              <Input
                id="settings-email-password"
                type="password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                aria-describedby={
                  emailErrors.currentPassword ? 'settings-email-password-error' : undefined
                }
                aria-invalid={emailErrors.currentPassword ? true : undefined}
                {...registerEmail('currentPassword')}
              />
              {emailErrors.currentPassword ? (
                <p id="settings-email-password-error" role="alert" className="text-sm text-destructive">
                  {emailErrors.currentPassword.message}
                </p>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" disabled={emailMutation.isPending || !emailDirty}>
                {emailMutation.isPending ? 'Saving...' : 'Change Email'}
              </Button>
            </div>
          </form>
        </section>

        {/* Section 3: Password */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Password</h2>
            <p className="text-sm text-muted-foreground">
              Choose a strong password with at least 8 characters.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handlePasswordSubmit((data) => passwordMutation.mutate(data))}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                Current Password
              </span>
              <Input
                id="settings-password-current"
                type="password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                aria-describedby={
                  passwordErrors.currentPassword ? 'settings-password-current-error' : undefined
                }
                aria-invalid={passwordErrors.currentPassword ? true : undefined}
                {...registerPassword('currentPassword')}
              />
              {passwordErrors.currentPassword ? (
                <p
                  id="settings-password-current-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {passwordErrors.currentPassword.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                New Password
              </span>
              <Input
                id="settings-password-new"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-describedby={
                  passwordErrors.newPassword ? 'settings-password-new-error' : undefined
                }
                aria-invalid={passwordErrors.newPassword ? true : undefined}
                {...registerPassword('newPassword')}
              />
              {passwordErrors.newPassword ? (
                <p id="settings-password-new-error" role="alert" className="text-sm text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" disabled={passwordMutation.isPending || !passwordDirty}>
                {passwordMutation.isPending ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
