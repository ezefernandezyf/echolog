'use client';

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/auth-store';
import { Button } from '../../shared/components/ui/button';
import { ErrorAlert } from '../../shared/components/ui/error-alert';
import { PageTitle } from '../../core/page-title';
import { invitationsApi } from '../../core/api-client';
import type { WorkspaceRole } from '../../../../shared/contracts/index.js';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const isAuthenticated = !!session;

  // Fetch invitation details
  const invitationQuery = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => invitationsApi.getByToken(token!),
    enabled: !!token,
    retry: false,
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: () => invitationsApi.accept(token!),
    onSuccess: (data) => {
      toast.success('You have joined the workspace!');
      navigate(`/w/${data.workspaceId}`, { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: () => invitationsApi.decline(token!),
    onSuccess: () => {
      toast.success('Invitation declined');
      navigate('/', { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to decline invitation');
    },
  });

  // Loading state
  if (invitationQuery.isPending) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 animate-fade-in"
      >
        <div className="w-full space-y-6">
          <div className="mx-auto h-10 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto h-4 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto h-11 w-40 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </main>
    );
  }

  // Error states
  if (invitationQuery.isError) {
    const error = invitationQuery.error;
    const message = error instanceof Error ? error.message : 'Invitation not found';

    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 animate-fade-in"
      >
        <PageTitle title="Invitation" />
        <div className="w-full space-y-6 text-center">
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-card">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-6 text-red-600 dark:text-red-400"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Invitation Unavailable
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              Go to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const invitation = invitationQuery.data;

  // Not authenticated — prompt to log in
  if (!isAuthenticated) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 animate-fade-in"
      >
        <PageTitle title="Invitation" />
        <div className="w-full space-y-6 text-center">
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-card">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-6 text-blue-600 dark:text-blue-400"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              You've been invited!
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              You've been invited to join <strong>{invitation.workspaceName}</strong> as{' '}
              <strong>{ROLE_LABELS[invitation.role] ?? invitation.role}</strong>.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
              >
                Sign in
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated — show accept/decline
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 animate-fade-in"
    >
      <PageTitle title={`Invitation to ${invitation.workspaceName}`} />
      <div className="w-full space-y-6 text-center">
        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-card">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="size-6 text-green-600 dark:text-green-400"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            You're invited!
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You've been invited to join{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {invitation.workspaceName}
            </strong>{' '}
            as{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {ROLE_LABELS[invitation.role] ?? invitation.role}
            </strong>.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              type="button"
              className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
              disabled={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={declineMutation.isPending}
              onClick={() => declineMutation.mutate()}
            >
              {declineMutation.isPending ? 'Declining...' : 'Decline'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
