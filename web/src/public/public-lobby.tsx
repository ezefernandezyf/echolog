'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicWorkspaces } from '../hooks/use-public-workspaces';
import { publicApi } from '../api/public';
import { Button } from '../shared/components/ui/button';
import type { PublicWorkspaceDTO } from '../../../shared/contracts/index.js';
import { PageTitle } from '../core/page-title';

type SortMode = 'recent' | 'popular';

export function PublicLobby() {
  const [sort, setSort] = useState<SortMode>('recent');
  const [allWorkspaces, setAllWorkspaces] = useState<PublicWorkspaceDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  const { data, isPending, isError } = usePublicWorkspaces(sort);

  // Sync initial data when sort changes or first load
  if (data && !initialSyncDone) {
    setAllWorkspaces(data.workspaces);
    setNextCursor(data.nextCursor);
    setInitialSyncDone(true);
  }

  // Reset when sort changes
  const handleSortChange = (newSort: SortMode) => {
    if (newSort === sort) return;
    setSort(newSort);
    setAllWorkspaces([]);
    setNextCursor(null);
    setInitialSyncDone(false);
  };

  // When data arrives after sort change
  if (data && allWorkspaces.length === 0 && data.workspaces.length > 0 && initialSyncDone) {
    setAllWorkspaces(data.workspaces);
    setNextCursor(data.nextCursor);
  }

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await publicApi.listWorkspaces(sort, nextCursor);
      setAllWorkspaces((prev) => [...prev, ...result.workspaces]);
      setNextCursor(result.nextCursor);
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14 animate-fade-in">
      <PageTitle title="Discover Workspaces" />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl">
            Discover Public Workspaces
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse feedback boards shared by the EchoLog community.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => handleSortChange('recent')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === 'recent'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('popular')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === 'popular'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Popular
          </button>
        </div>
      </div>

      {/* Loading */}
      {isPending && allWorkspaces.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : null}

      {/* Error */}
      {isError && allWorkspaces.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load workspaces. Please try again.
          </p>
        </div>
      ) : null}

      {/* Empty */}
      {!isPending && !isError && allWorkspaces.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-2xl">🌍</p>
          <p className="mt-3 text-sm text-muted-foreground">
            No public workspaces yet. Be the first to share!
          </p>
          <Link
            to="/register"
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            Create your workspace
          </Link>
        </div>
      ) : null}

      {/* Grid */}
      {allWorkspaces.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allWorkspaces.map((ws) => (
              <Link
                key={ws.id}
                to={`/explore/${ws.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary transition-colors">
                  {ws.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">/{ws.slug}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{ws.memberCount}</strong> members
                  </span>
                  <span>
                    <strong className="text-foreground">{ws.postCount}</strong> posts
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {nextCursor ? (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-10 px-6"
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
