'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { boardApi, postApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { PostSkeleton } from '../../shared/components/domain-skeletons';
import { useAuthenticatedShell } from '../../auth/authenticated-layout';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
import { PageTitle } from '../../core/page-title';
import { useUiStore } from '../../core/store/ui-store';

function mapPostToRow(post: {
  id: string;
  title: string;
  body: string;
  status: string;
  voteCount: number;
  commentCount: number;
  authorId: string;
  isUpvoted?: boolean;
}): PostRowData {
  return {
    id: post.id,
    title: post.title,
    description: post.body,
    status: post.status,
    upvotes: post.voteCount,
    comments: post.commentCount,
    author: post.authorId,
    isUpvoted: post.isUpvoted,
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
  const openModal = useUiStore((state) => state.openModal);
  const [activeSort, setActiveSort] = useState<PostSort>('Trending');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

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

  useFocusOnMount('h1');

  const postsQuery = useInfiniteQuery({
    queryKey: ['posts', effectiveBoardId, { status: activeStatus, sort: activeSort }],
    queryFn: async ({ pageParam }) =>
      postApi.list(effectiveBoardId!, {
        status: activeStatus ?? undefined,
        sort: SORT_TO_API[activeSort],
        cursor: (pageParam as string | null) ?? undefined,
        limit: PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: (previousData) => previousData,
    enabled: !!effectiveBoardId,
  });

  // Derive posts from all loaded pages — no local accumulated state.
  // React Query cache is the single source of truth for vote/status data.
  const posts = useMemo(() => {
    if (!postsQuery.data) return [];
    return postsQuery.data.pages.flatMap((page) => page.posts ?? []).map(mapPostToRow);
  }, [postsQuery.data]);

  const hasMore = postsQuery.hasNextPage;
  const isLoadingMore = postsQuery.isFetchingNextPage;

  const handleStatusChange = (status: string | null) => {
    setActiveStatus(status);
  };

  const handleSortChange = (sort: PostSort) => {
    setActiveSort(sort);
  };

  const handleLoadMore = () => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      postsQuery.fetchNextPage();
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-1 flex-col animate-fade-in overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-background dark:text-foreground"
    >
      <PageTitle title={selectedBoard?.name ?? ''} />
      {!workspaceId ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Select a workspace from the sidebar.
          </p>
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
      ) : !postsQuery.data && postsQuery.isPending ? (
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
          onCreatePost={() => openModal('create-post')}
          boardId={effectiveBoardId}
        />
      )}
    </main>
  );
}

export default BoardLayout;
