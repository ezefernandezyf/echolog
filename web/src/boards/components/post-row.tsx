import { Badge } from '../../shared/components/ui/badge';
import { cn } from '../../shared/lib/cn';

export interface PostRowData {
  id: string;
  title: string;
  description: string;
  status: 'Planned' | 'In Review' | 'Live' | 'Needs Triage';
  upvotes: number;
  comments: number;
  isUpvoted?: boolean;
  author?: string;
  createdAt: string;
  trendScore: number;
}

interface PostRowProps {
  post: PostRowData;
}

const statusStyles: Record<PostRowData['status'], string> = {
  Planned: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  'In Review': 'border-zinc-200 bg-white text-zinc-700',
  Live: 'border-zinc-200 bg-zinc-900 text-white',
  'Needs Triage': 'border-zinc-200 bg-zinc-50 text-zinc-500',
};

export function PostRow({ post }: PostRowProps) {
  const initials = (post.author ?? post.title)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article className="group grid grid-cols-[auto_1fr_auto] gap-4 border-b border-zinc-200 bg-white px-5 py-5 transition-colors hover:bg-zinc-50/80 sm:px-6">
      <button
        type="button"
        aria-label={`Upvote ${post.title}`}
        className={cn(
          'flex h-14 w-12 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium tracking-[0.12em] transition-colors duration-150',
          post.isUpvoted
            ? 'border-zinc-900 text-zinc-900'
            : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900',
        )}
      >
        <span className="text-sm leading-none">▲</span>
        <span>{post.upvotes}</span>
      </button>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-zinc-950 group-hover:text-zinc-900">
            {post.title}
          </h3>
          <Badge variant="outline" className={cn('border px-2.5 py-1', statusStyles[post.status])}>
            {post.status}
          </Badge>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-zinc-500">{post.description}</p>
      </div>

      <div className="flex flex-col items-end justify-between gap-3 pt-0.5 text-right">
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm shadow-zinc-900/[0.02]">
          <span className="text-zinc-400">◎</span>
          {post.comments} comments
        </span>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 font-medium text-zinc-500">
            {initials || 'EL'}
          </span>
        </div>
      </div>
    </article>
  );
}
