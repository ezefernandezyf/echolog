import { useState, useEffect } from 'react';
import { Button } from '../../shared/components/ui/button';
import { cn } from '../../shared/lib/cn';
import { PostRow, type PostRowData } from './post-row';

export type PostSort = 'Trending' | 'Top' | 'New';

interface PostListProps {
  title: string;
  posts: PostRowData[];
  activeSort: PostSort;
  onSortChange: (sort: PostSort) => void;
  onCreatePost?: () => void;
  boardId: string;
}

const sortTabs: PostSort[] = ['Trending', 'Top', 'New'];

function sortPosts(posts: PostRowData[], sort: PostSort) {
  const sorted = [...posts];

  if (sort === 'Top') {
    return sorted.sort((left, right) => right.upvotes - left.upvotes);
  }

  if (sort === 'New') {
    return sorted.sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));
  }

  return sorted.sort((left, right) => right.trendScore - left.trendScore);
}

function filterPosts(posts: PostRowData[], query: string): PostRowData[] {
  if (!query.trim()) return posts;
  const q = query.toLowerCase();
  return posts.filter(
    (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
}

export function PostList({
  title,
  posts,
  activeSort,
  onSortChange,
  onCreatePost,
  boardId,
}: PostListProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const sortedPosts = sortPosts(posts, activeSort);
  const filtered = filterPosts(sortedPosts, debounced);

  return (
    <section className="flex min-h-screen flex-1 flex-col bg-white dark:bg-card">
      <header className="border-b border-zinc-200 px-6 py-6 sm:px-8 dark:border-zinc-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
              EchoLog Board
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-100">{title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {sortTabs.map((sort) => {
                const active = sort === activeSort;

                return (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => onSortChange(sort)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100',
                    )}
                  >
                    {sort}
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              className="bg-zinc-950 px-5 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
              onClick={onCreatePost}
            >
              + Submit new feedback
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full sm:max-w-md rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-card dark:text-foreground dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
        </div>
      </header>

      <div className="flex-1 bg-zinc-50/40 dark:bg-background/40">
        <div className="mx-auto w-full max-w-6xl px-0 py-0">
          <div className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02] dark:border-zinc-800 dark:bg-card">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  {debounced ? 'No posts match your search.' : 'No posts yet.'}
                </p>
              </div>
            ) : (
              filtered.map((post) => (
                <div key={post.id} className="animate-fade-in">
                  <PostRow post={post} boardId={boardId} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
