'use client';

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar, type SidebarItem } from './sidebar';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { useUiStore } from '../../core/store/ui-store';
import { boardApi, postApi } from '../../core/api-client';
import { CreatePostModal } from './create-post-modal';
import { CreateBoardModal } from './create-board-modal';
import { Button } from '../../shared/components/ui/button';
import { PostSkeleton, BoardSkeletonList } from '../../shared/components/domain-skeletons';

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
    <main className="flex min-h-screen bg-zinc-50 text-zinc-950">
      {boardsQuery.isPending ? (
        <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
          <div className="border-b border-zinc-200 px-5 py-5">
            <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400">
                  Workspace
                </p>
                <div className="h-5 w-28 animate-pulse rounded-md bg-zinc-200" />
              </div>
            </div>
          </div>
          <BoardSkeletonList count={5} />
        </aside>
      ) : boardsQuery.isError ? (
        <aside className="flex w-72 shrink-0 flex-col items-center justify-center gap-3 border-r border-zinc-200 bg-red-50/30 p-5">
          <p className="text-sm text-red-600">Failed to load boards</p>
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
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {!selectedBoardId ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-400">
              {boardsQuery.data && boardsQuery.data.length === 0
                ? 'No boards in this workspace. Create one to get started.'
                : 'Select a board from the sidebar.'}
            </p>
          </div>
        ) : postsQuery.isPending ? (
          <section className="flex min-h-screen flex-1 flex-col bg-white">
            <header className="border-b border-zinc-200 px-6 py-6 sm:px-8">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                  EchoLog Board
                </p>
                <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200" />
              </div>
              <div className="mt-4">
                <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-zinc-200" />
              </div>
            </header>
            <div className="flex-1 bg-zinc-50/40">
              <div className="mx-auto w-full max-w-6xl">
                <div className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02]">
                  {Array.from({ length: 3 }, (_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : postsQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-600">Failed to load posts</p>
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
