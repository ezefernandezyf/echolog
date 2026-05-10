"use client";

import { useState } from 'react';
import { Sidebar, type SidebarItem } from './sidebar';
import { PostList, type PostSort } from './post-list';
import type { PostRowData } from './post-row';
import { useUiStore } from '../../core/store/ui-store';
import { CreatePostModal } from './create-post-modal';

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'all-posts', label: 'All Posts' },
  { id: 'feature-requests', label: 'Feature Requests' },
  { id: 'bug-reports', label: 'Bug Reports' },
];

const MOCK_POSTS: PostRowData[] = [
  {
    id: 'post-1',
    title: 'Add dark mode for night-time review sessions',
    description:
      'A monochrome dark theme would reduce eye strain and help teams review feedback after hours without losing the clean system feel.',
    status: 'In Review',
    upvotes: 148,
    comments: 24,
    isUpvoted: true,
    author: 'Maya Chen',
    createdAt: '2026-05-10T09:12:00.000Z',
    trendScore: 98,
  },
  {
    id: 'post-2',
    title: 'Board filters should persist between sessions',
    description:
      'Keep the last selected board, sort order, and category filter so reviewers return to the exact context they left behind.',
    status: 'Planned',
    upvotes: 92,
    comments: 13,
    author: 'Jordan Lee',
    createdAt: '2026-05-08T16:40:00.000Z',
    trendScore: 88,
  },
  {
    id: 'post-3',
    title: 'Upvote counter should animate on hover and vote',
    description:
      'The current static counter feels a little flat. A subtle motion cue would make voting feedback feel more immediate and tactile.',
    status: 'Live',
    upvotes: 231,
    comments: 41,
    author: 'Priya Patel',
    createdAt: '2026-05-09T14:25:00.000Z',
    trendScore: 113,
  },
  {
    id: 'post-4',
    title: 'Improve bug report templates with reproduction steps',
    description:
      'Ask for environment, expected result, and actual result up front so support can triage issues without back-and-forth.',
    status: 'Needs Triage',
    upvotes: 64,
    comments: 9,
    author: 'Sam Torres',
    createdAt: '2026-05-10T11:45:00.000Z',
    trendScore: 77,
  },
];

interface BoardLayoutProps {
  workspaceName?: string;
  boardTitle?: string;
  posts?: PostRowData[];
}

export function BoardLayout({
  workspaceName = 'Northstar Labs',
  boardTitle = 'Feature Requests',
  posts = MOCK_POSTS,
}: BoardLayoutProps) {
  const openModal = useUiStore((state) => state.openModal);
  const [activeSort, setActiveSort] = useState<PostSort>('Trending');

  return (
    <main className="flex min-h-screen bg-zinc-50 text-zinc-950">
      <Sidebar workspaceName={workspaceName} items={SIDEBAR_ITEMS} activeItemId="all-posts" />
      <div className="flex min-h-screen flex-1 flex-col">
        <PostList
          title={boardTitle}
          posts={posts}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          onCreatePost={() => openModal('create-post')}
        />
        <CreatePostModal />
      </div>
    </main>
  );
}

export default BoardLayout;
