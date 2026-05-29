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
    estimateSize: () => 132,
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
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
    <section className="flex min-h-screen flex-1 flex-col bg-card">
      <header className="border-b border-border px-4 py-4 sm:px-6 sm:py-6 pr-14 lg:pr-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              EchoLog Board
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-border bg-secondary p-1">
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
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sort}
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              className="bg-primary px-5 hover:bg-primary/90 active:bg-primary/80"
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
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-secondary-foreground hover:bg-secondary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-3 mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            aria-label="Search posts"
            className="w-full sm:max-w-md rounded-xl border border-border px-4 py-2 text-base outline-none transition-colors focus:border-primary/30"
          />
        </div>
      </header>

      <div className="flex-1 bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-0 pt-6 lg:pt-8">
          <div
            className="overflow-hidden border-x border-b border-border bg-card shadow-sm shadow-black/[0.02]"
            role="region"
            aria-live="polite"
            aria-atomic="true"
          >
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted-foreground">
                  {debounced ? 'No posts match your search.' : 'No posts yet.'}
                </p>
              </div>
            ) : shouldVirtualize ? (
              <>
                <VirtualizedPostList posts={filtered} boardId={boardId} />

                {/* Load more */}
                {hasMore && (
                  <div className="flex items-center justify-center border-t border-border px-6 py-5">
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
                  <div className="flex items-center justify-center border-t border-border px-6 py-5">
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
