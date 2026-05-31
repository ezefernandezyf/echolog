'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { useInfinitePosts } from '../../hooks/use-posts';
import { useBoards } from '../../hooks/use-boards';
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

  const boardsQuery = useBoards(workspaceId);

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

  const postsQuery = useInfinitePosts(effectiveBoardId, {
    status: activeStatus,
    sort: SORT_TO_API[activeSort],
    pageSize: PAGE_SIZE,
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
      className="flex min-h-screen flex-1 flex-col animate-fade-in overflow-x-hidden bg-secondary text-foreground"
    >
      <PageTitle title={selectedBoard?.name ?? ''} />
      {!workspaceId ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Select a workspace from the sidebar.</p>
        </div>
      ) : boardsQuery.isPending ? (
        <section className="flex min-h-screen flex-1 flex-col bg-card">
          <header className="border-b border-border px-6 py-6 sm:px-8">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                EchoLog Board
              </p>
              <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="mt-4">
              <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />
            </div>
          </header>
          <div className="flex-1 bg-secondary/40">
            <div className="mx-auto w-full max-w-6xl">
              <div className="overflow-hidden border-x border-b border-border bg-card shadow-sm shadow-black/[0.02]">
                {Array.from({ length: 3 }, (_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : boardsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">Failed to load boards</p>
          <Button type="button" variant="outline" onClick={() => boardsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : !effectiveBoardId ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {boardsQuery.data && boardsQuery.data.length === 0
              ? 'No boards in this workspace. Create one to get started.'
              : 'Select a board from the sidebar.'}
          </p>
        </div>
      ) : !postsQuery.data && postsQuery.isPending ? (
        <section className="flex min-h-screen flex-1 flex-col bg-card">
          <header className="border-b border-border px-6 py-6 sm:px-8">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                EchoLog Board
              </p>
              <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="mt-4">
              <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />
            </div>
          </header>
          <div className="flex-1 bg-secondary/40">
            <div className="mx-auto w-full max-w-6xl">
              <div className="overflow-hidden border-x border-b border-border bg-card shadow-sm shadow-black/[0.02]">
                {Array.from({ length: 3 }, (_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : postsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">Failed to load posts</p>
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
