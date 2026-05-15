import { useState, useEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Button } from '../../shared/components/ui/button';
import { cn } from '../../shared/lib/cn';
import { PostRow, type PostRowData } from './post-row';

export type PostSort = 'Trending' | 'Top' | 'New';

const STATUS_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
] as const;

interface PostListProps {
  title: string;
  posts: PostRowData[];
  activeSort: PostSort;
  onSortChange: (sort: PostSort) => void;
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onCreatePost?: () => void;
  boardId: string;
}

const sortTabs: PostSort[] = ['Trending', 'Top', 'New'];

function VirtualizedPostList({ posts, boardId }: { posts: PostRowData[]; boardId: string }) {
  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div
      style={{
        position: 'relative',
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const post = posts[virtualItem.index];
        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PostRow post={post} boardId={boardId} />
          </div>
        );
      })}
    </div>
  );
}

export function PostList({
  title,
  posts,
  activeSort,
  onSortChange,
  activeStatus,
  onStatusChange,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onCreatePost,
  boardId,
}: PostListProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  // Mobile detection for virtualization gate
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered = debounced.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(debounced.toLowerCase()) ||
          p.description.toLowerCase().includes(debounced.toLowerCase()),
      )
    : posts;

  const shouldVirtualize = isMobile || filtered.length > 20;

  return (
    <section className="flex min-h-screen flex-1 flex-col bg-white dark:bg-card">
      <header className="border-b border-zinc-200 px-6 py-6 sm:px-8 pr-14 lg:pr-8 dark:border-zinc-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
              EchoLog Board
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-100">
              {title}
            </h1>
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
                    aria-pressed={active}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors max-sm:min-h-[44px] max-sm:py-3',
                      active
                        ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100',
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

        {/* Status filter pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'all'}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              aria-pressed={activeStatus === opt.value}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors max-sm:min-h-[44px] max-sm:py-3',
                activeStatus === opt.value
                  ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            aria-label="Search posts"
            className="w-full sm:max-w-md rounded-xl border border-zinc-200 px-4 py-2 text-base outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-card dark:text-foreground dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
        </div>
      </header>

      <div className="flex-1 bg-zinc-50/40 dark:bg-background/40">
        <div className="mx-auto w-full max-w-6xl px-0 py-0">
          <div
            className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02] dark:border-zinc-800 dark:bg-card"
            role="region"
            aria-live="polite"
            aria-atomic="true"
          >
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  {debounced ? 'No posts match your search.' : 'No posts yet.'}
                </p>
              </div>
            ) : shouldVirtualize ? (
              <>
                <VirtualizedPostList posts={filtered} boardId={boardId} />

                {/* Load more */}
                {hasMore && (
                  <div className="flex items-center justify-center border-t border-zinc-200 px-6 py-5 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Loading...' : 'Load more posts'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {filtered.map((post) => (
                  <div key={post.id} className="animate-fade-in">
                    <PostRow post={post} boardId={boardId} />
                  </div>
                ))}

                {/* Load more */}
                {hasMore && (
                  <div className="flex items-center justify-center border-t border-zinc-200 px-6 py-5 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Loading...' : 'Load more posts'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
