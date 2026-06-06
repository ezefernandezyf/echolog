'use client';

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public';
import { useAuthStore } from '../auth/auth-store';
import { Button } from '../shared/components/ui/button';
import type { PublicBoardDTO } from '../../../shared/contracts/index.js';
import { PageTitle } from '../core/page-title';
import { queryKeys } from '../hooks/query-keys';

function BoardCard({ board, workspaceSlug }: { board: PublicBoardDTO; workspaceSlug: string }) {
  return (
    <Link
      to={`/explore/${workspaceSlug}/${board.slug}`}
      className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary transition-colors">
        {board.name}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">/{board.slug}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{board.postCount}</strong> post{board.postCount !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}

export function PublicWorkspaceView() {
  const { slug } = useParams<{ slug: string }>();
  const session = useAuthStore((state) => state.session);

  const { data: workspace, isPending, isError } = useQuery({
    queryKey: queryKeys.public.workspaceDetail(slug ?? ''),
    queryFn: () => publicApi.getWorkspaceBySlug(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const isLoggedIn = !!session;

  if (isPending) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (isError || !workspace) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-3 text-sm text-muted-foreground">Workspace not found.</p>
          <Link
            to="/explore"
            className="mt-4 inline-block text-sm font-medium text-foreground underline"
          >
            Back to discovery
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
      <PageTitle title={`${workspace.name} - EchoLog`} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm">
        <Link to="/explore" className="text-muted-foreground transition-colors hover:text-foreground">
          Discover
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground" aria-current="page">
          {workspace.name}
        </span>
      </nav>

      {/* Workspace header */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
          {workspace.name}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{workspace.memberCount}</strong> member{workspace.memberCount !== 1 ? 's' : ''}
          </span>
          <span>
            <strong className="text-foreground">{workspace.postCount}</strong> post{workspace.postCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Public notice / CTA — access-level aware */}
      <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {!isLoggedIn
              ? 'You are browsing as a guest. Sign in to vote, comment, and create posts.'
              : workspace.publicAccessLevel === 'READ_ONLY'
                ? 'This workspace is read-only. Become a member to vote, comment, and create posts.'
                : workspace.publicAccessLevel === 'INTERACT'
                  ? 'You can vote and comment on posts. Creating posts and boards requires membership.'
                  : 'You have full access. Create boards and posts freely.'}
          </p>
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="primary" className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="h-9 px-4 text-sm">
                  Register
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Access-level action hints — only shown for logged-in non-members */}
      {isLoggedIn && workspace.publicAccessLevel === 'INTERACT' ? (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm">
              💬
            </span>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Interact mode:</strong> You can vote and comment on posts.
              <Link to="/register" className="ml-1 font-medium text-accent underline hover:no-underline">
                Join
              </Link>{' '}
              to create boards and posts.
            </p>
          </div>
        </div>
      ) : null}

      {isLoggedIn && workspace.publicAccessLevel === 'FULL' ? (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm">
              🚀
            </span>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Full access mode:</strong> You can create boards and posts.
            </p>
          </div>
        </div>
      ) : null}

      {/* Access-level create action — FULL non-members can create boards */}
      {isLoggedIn && workspace.publicAccessLevel === 'FULL' && workspace.boards.length > 0 ? (
        <div className="mb-4 flex justify-end">
          <Link
            to={`/explore/${workspace.slug}/new-board`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
          >
            + New Board
          </Link>
        </div>
      ) : null}

      {/* Boards list */}
      {workspace.boards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {workspace.boards.map((board) => (
            <BoardCard key={board.id} board={board} workspaceSlug={workspace.slug} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            This workspace has no boards yet.
          </p>
          {isLoggedIn && workspace.publicAccessLevel === 'FULL' ? (
            <Link
              to={`/explore/${workspace.slug}/new-board`}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              Create the first board
            </Link>
          ) : !isLoggedIn ? (
            <Link
              to="/register"
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              Join this workspace
            </Link>
          ) : null}
        </div>
      )}
    </main>
  );
}
