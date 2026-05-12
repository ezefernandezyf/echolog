'use client';

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar, type SidebarItem } from './sidebar';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { useUiStore } from '../../core/store/ui-store';
import { boardApi, postApi, workspaceApi } from '../../core/api-client';
import { CreatePostModal } from './create-post-modal';
import { CreateBoardModal } from './create-board-modal';
import { Button } from '../../shared/components/ui/button';
import { PostSkeleton, BoardSkeletonList } from '../../shared/components/domain-skeletons';
import { cn } from '../../shared/lib/cn';

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

export function BoardLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const openModal = useUiStore((state) => state.openModal);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const openSidebar = useUiStore((state) => state.openSidebar);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const [activeSort, setActiveSort] = useState<PostSort>('Trending');

  const workspaceQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
    staleTime: 60_000,
    enabled: !!workspaceId,
  });

  const workspaceName =
    workspaceQuery.data?.find((w) => w.id === workspaceId)?.name ?? workspaceId ?? '';

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
  });

  const sidebarItems: SidebarItem[] = boardsQuery.data
    ? boardsQuery.data.map((b) => ({ id: b.id, label: b.name }))
    : [];

  // Auto-select first board
  const selectedBoardId = boardsQuery.data?.[0]?.id ?? null;

  const selectedBoard = boardsQuery.data?.find((b) => b.id === selectedBoardId);

  const postsQuery = useQuery({
    queryKey: ['posts', selectedBoardId],
    queryFn: () => postApi.list(selectedBoardId!),
    enabled: !!selectedBoardId,
  });

  const posts: PostRowData[] = postsQuery.data ? postsQuery.data.map(mapPostToRow) : [];

  return (
    <main className="flex min-h-screen bg-zinc-50 text-zinc-950 dark:bg-background dark:text-foreground">
      {boardsQuery.isPending ? (
        <aside
          className={cn(
            'flex w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-background',
            'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
            'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
            <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-card">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                  Workspace
                </p>
                <div className="h-5 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
          <BoardSkeletonList count={5} />
        </aside>
      ) : boardsQuery.isError ? (
        <aside
          className={cn(
            'flex flex-col items-center justify-center gap-3 border-r border-zinc-200 p-5 dark:border-zinc-800 dark:bg-red-950/20',
            'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
            'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load boards</p>
          <Button type="button" variant="outline" onClick={() => boardsQuery.refetch()}>
            Retry
          </Button>
        </aside>
      ) : (
        <Sidebar
          workspaceName={workspaceName}
          items={sidebarItems}
          activeItemId={selectedBoardId ?? ''}
          onCreateBoard={() => openModal('create-board')}
          onNavClick={closeSidebar}
          className={cn(
            'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
            'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        />
      )}

      {/* Mobile overlay — shown when sidebar is open on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col animate-fade-in">
        {/* Hamburger button — visible only on mobile */}
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open sidebar"
          className="fixed top-4 left-4 z-20 rounded-full border border-zinc-200 bg-white p-2 shadow-sm transition-colors hover:bg-zinc-50 lg:hidden dark:border-zinc-700 dark:bg-card dark:hover:bg-zinc-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5 text-zinc-700 dark:text-zinc-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        {!selectedBoardId ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              {boardsQuery.data && boardsQuery.data.length === 0
                ? 'No boards in this workspace. Create one to get started.'
                : 'Select a board from the sidebar.'}
            </p>
          </div>
        ) : postsQuery.isPending ? (
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
            onSortChange={setActiveSort}
            onCreatePost={() => openModal('create-post')}
            boardId={selectedBoardId}
          />
        )}
        <CreatePostModal boardId={selectedBoardId ?? undefined} />
        <CreateBoardModal workspaceId={workspaceId!} />
      </div>
    </main>
  );
}

export default BoardLayout;
