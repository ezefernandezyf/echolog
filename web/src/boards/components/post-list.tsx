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

export function PostList({ title, posts, activeSort, onSortChange, onCreatePost }: PostListProps) {
  const sortedPosts = sortPosts(posts, activeSort);

  return (
    <section className="flex min-h-screen flex-1 flex-col bg-white">
      <header className="border-b border-zinc-200 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">EchoLog Board</p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
              {sortTabs.map((sort) => {
                const active = sort === activeSort;

                return (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => onSortChange(sort)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-950',
                    )}
                  >
                    {sort}
                  </button>
                );
              })}
            </div>

            <Button type="button" className="bg-zinc-950 px-5 hover:bg-zinc-800 active:bg-zinc-900" onClick={onCreatePost}>
              + Submit new feedback
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-zinc-50/40">
        <div className="mx-auto w-full max-w-6xl px-0 py-0">
          <div className="overflow-hidden border-x border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02]">
            {sortedPosts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
