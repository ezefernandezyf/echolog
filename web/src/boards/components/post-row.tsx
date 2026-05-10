import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '../../shared/components/ui/badge';
import { cn } from '../../shared/lib/cn';
import { voteApi } from '../../core/api-client';

export interface PostRowData {
  id: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  comments: number;
  isUpvoted?: boolean;
  author?: string;
  createdAt: string;
  trendScore: number;
}

interface PostRowProps {
  post: PostRowData;
  boardId: string;
}

const statusStyles: Record<string, string> = {
  OPEN: 'border-zinc-200 bg-zinc-50 text-zinc-500',
  PLANNED: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  IN_PROGRESS: 'border-zinc-200 bg-white text-zinc-700',
  DONE: 'border-zinc-200 bg-zinc-900 text-white',
};

export function PostRow({ post, boardId }: PostRowProps) {
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: () => voteApi.toggle(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['posts', boardId] });

      const previousPosts = queryClient.getQueryData<PostRowData[]>(['posts', boardId]);

      queryClient.setQueryData<PostRowData[]>(['posts', boardId], (old) =>
        old?.map((p) =>
          p.id === post.id
            ? {
                ...p,
                upvotes: p.isUpvoted ? p.upvotes - 1 : p.upvotes + 1,
                isUpvoted: !p.isUpvoted,
              }
            : p,
        ),
      );

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', boardId], context.previousPosts);
      }
      toast.error('Failed to vote. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', boardId] });
    },
  });

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
        disabled={voteMutation.isPending}
        onClick={() => voteMutation.mutate()}
        aria-label={`${post.isUpvoted ? 'Remove vote from' : 'Upvote'} ${post.title}`}
        className={cn(
          'flex h-14 w-12 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium tracking-[0.12em] transition-all duration-150',
          voteMutation.isPending && 'animate-pulse',
          post.isUpvoted
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900',
        )}
      >
        <span className="text-sm leading-none">{post.isUpvoted ? '▲' : '▲'}</span>
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
