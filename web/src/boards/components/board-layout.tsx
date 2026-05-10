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
import { Button } from '../../shared/components/ui/button';

function mapPostToRow(post: {
  id: string;
  title: string;
  body: string;
  voteCount: number;
  authorId: string;
}): PostRowData {
  return {
    id: post.id,
    title: post.title,
    description: post.body,
    status: 'Needs Triage' as PostRowData['status'],
    upvotes: post.voteCount,
    comments: 0,
    author: post.authorId,
    createdAt: new Date().toISOString(),
    trendScore: post.voteCount,
  };
}

export function BoardLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const openModal = useUiStore((state) => state.openModal);
  const [activeSort, setActiveSort] = useState<PostSort>('Trending');

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
        <aside className="flex w-72 shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-50">
          <p className="text-sm text-zinc-400">Loading boards...</p>
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
          workspaceName={workspaceId ?? ''}
          items={sidebarItems}
          activeItemId={selectedBoardId ?? ''}
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
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-400">Loading posts...</p>
          </div>
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
      </div>
    </main>
  );
}

export default BoardLayout;
