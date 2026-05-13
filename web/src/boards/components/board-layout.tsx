'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { boardApi, postApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { PostSkeleton } from '../../shared/components/domain-skeletons';
import type { PostListResponse } from '../../../../shared/contracts/index.js';
import { useAuthenticatedShell } from '../../auth/authenticated-layout';

function mapPostToRow(post: {
  id: string;
  title: string;
  body: string;
  status: string;
  voteCount: number;
  commentCount: number;
  authorId: string;
}): PostRowData {
  return {
    id: post.id,
    title: post.title,
    description: post.body,
    status: post.status,
    upvotes: post.voteCount,
    comments: post.commentCount,
    author: post.authorId,
    createdAt: new Date().toISOString(),
    trendScore: post.voteCount,
  };
}

const SORT_TO_API: Record<PostSort, 'trending' | 'top' | 'new'> = {
  Trending: 'trending',
  Top: 'top',
  New: 'new',
};

const PAGE_SIZE = 20;

export function BoardLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedBoardId, setSelectedBoardId } = useAuthenticatedShell();
  const [activeSort, setActiveSort] = useState<PostSort>('Trending');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  // Accumulated posts across pages
  const accumulatedRef = useRef<PostRowData[]>([]);
  const [accumulated, setAccumulated] = useState<PostRowData[]>([]);

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
  });

  // Board selection: auto-select first, but allow manual switch
  useEffect(() => {
    if (!boardsQuery.data?.length) return;

    if (!selectedBoardId) {
      setSelectedBoardId(boardsQuery.data[0].id);
    }
  }, [boardsQuery.data, selectedBoardId, setSelectedBoardId]);

  const effectiveBoardId = selectedBoardId ?? boardsQuery.data?.[0]?.id ?? null;
  const selectedBoard = boardsQuery.data?.find((b) => b.id === effectiveBoardId);

  const postsQuery = useQuery<PostListResponse>({
    queryKey: ['posts', effectiveBoardId, { status: activeStatus, sort: activeSort, cursor }],
    queryFn: () =>
      postApi.list(effectiveBoardId!, {
        status: activeStatus ?? undefined,
        sort: SORT_TO_API[activeSort],
        cursor: cursor ?? undefined,
        limit: PAGE_SIZE,
      }),
    enabled: !!effectiveBoardId,
    placeholderData: (prev) => prev,
  });

  // Derive posts from accumulated state + current query page
  const posts = useMemo(() => {
    if (!postsQuery.data) return accumulated;

    const newRows = postsQuery.data.posts.map(mapPostToRow);
    const allRows = cursor ? [...accumulated, ...newRows] : newRows;

    // Keep ref in sync (avoid stale closure in loadMore)
    accumulatedRef.current = allRows;

    return allRows;
  }, [postsQuery.data, cursor, accumulated]);

  const hasMore = postsQuery.data?.nextCursor !== null;
  const isLoadingMore = postsQuery.isFetching && cursor !== null;

  const resetFilters = (newStatus: string | null = activeStatus, newSort: PostSort = activeSort) => {
    setCursor(null);
    setAccumulated([]);
    accumulatedRef.current = [];
    setActiveStatus(newStatus);
    setActiveSort(newSort);
  };

  const handleStatusChange = (status: string | null) => {
    resetFilters(status, activeSort);
  };

  const handleSortChange = (sort: PostSort) => {
    resetFilters(activeStatus, sort);
  };

  const handleLoadMore = () => {
    if (postsQuery.data?.nextCursor) {
      // Save current page's posts before changing cursor
      setAccumulated(accumulatedRef.current);
      setCursor(postsQuery.data.nextCursor);
    }
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col animate-fade-in overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-background dark:text-foreground">
      {!workspaceId ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Select a workspace from the sidebar.</p>
        </div>
      ) : boardsQuery.isPending ? (
        <section className="flex min-h-screen flex-1 flex-col bg-white dark:bg-card">
          <header className="border-b border-zinc-200 px-6 py-6 sm:px-8 dark:border-zinc-800">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                EchoLog Board
              </p>
              <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="mt-4">
              <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </header>
          <div className="flex-1 bg-zinc-50/40 dark:bg-background/40">
            <div className="mx-auto w-full max-w-6xl">
              <div className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02] dark:border-zinc-800 dark:bg-card">
                {Array.from({ length: 3 }, (_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : boardsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load boards</p>
          <Button type="button" variant="outline" onClick={() => boardsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : !effectiveBoardId ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {boardsQuery.data && boardsQuery.data.length === 0
              ? 'No boards in this workspace. Create one to get started.'
              : 'Select a board from the sidebar.'}
          </p>
        </div>
      ) : postsQuery.isPending && !cursor ? (
        <section className="flex min-h-screen flex-1 flex-col bg-white dark:bg-card">
          <header className="border-b border-zinc-200 px-6 py-6 sm:px-8 dark:border-zinc-800">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                EchoLog Board
              </p>
              <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="mt-4">
              <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </header>
          <div className="flex-1 bg-zinc-50/40 dark:bg-background/40">
            <div className="mx-auto w-full max-w-6xl">
              <div className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02] dark:border-zinc-800 dark:bg-card">
                {Array.from({ length: 3 }, (_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : postsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load posts</p>
          <Button type="button" variant="outline" onClick={() => postsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <PostList
          title={selectedBoard?.name ?? ''}
          posts={posts}
          activeSort={activeSort}
          onSortChange={handleSortChange}
          activeStatus={activeStatus}
          onStatusChange={handleStatusChange}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          boardId={effectiveBoardId}
        />
      )}
    </main>
  );
}

export default BoardLayout;
