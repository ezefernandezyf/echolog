import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '../../shared/components/ui/badge';
import { cn } from '../../shared/lib/cn';
import { commentApi, postApi, voteApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';

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

const POST_STATUSES = ['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE'] as const;

function nextStatus(current: string): string {
  const idx = POST_STATUSES.indexOf(current as (typeof POST_STATUSES)[number]);
  return POST_STATUSES[(idx + 1) % POST_STATUSES.length];
}

const statusStyles: Record<string, string> = {
  OPEN: 'border-zinc-200 bg-zinc-50 text-zinc-500 cursor-pointer hover:bg-zinc-100',
  PLANNED: 'border-zinc-200 bg-zinc-100 text-zinc-600 cursor-pointer hover:bg-zinc-200',
  IN_PROGRESS: 'border-zinc-200 bg-white text-zinc-700 cursor-pointer hover:bg-zinc-100',
  DONE: 'border-zinc-200 bg-zinc-900 text-white cursor-pointer hover:bg-zinc-800',
};

export function PostRow({ post, boardId }: PostRowProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const voteMutation = useMutation({
    mutationFn: () => voteApi.toggle(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['posts', boardId] });
      const previousPosts = queryClient.getQueryData<PostRowData[]>(['posts', boardId]);

      queryClient.setQueryData<PostRowData[]>(['posts', boardId], (old) =>
        old?.map((p) =>
          p.id === post.id
            ? { ...p, upvotes: p.isUpvoted ? p.upvotes - 1 : p.upvotes + 1, isUpvoted: !p.isUpvoted }
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

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => postApi.updateStatus(boardId, post.id, newStatus),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['posts', boardId] });
      const previousPosts = queryClient.getQueryData<PostRowData[]>(['posts', boardId]);

      queryClient.setQueryData<PostRowData[]>(['posts', boardId], (old) =>
        old?.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p)),
      );

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', boardId], context.previousPosts);
      }
      toast.error('Failed to update status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', boardId] });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => commentApi.list(post.id),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => commentApi.create(post.id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      setCommentText('');
    },
    onError: () => toast.error('Failed to add comment.'),
  });

  const initials = (post.author ?? post.title)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article className="border-b border-zinc-200 bg-white transition-colors hover:bg-zinc-50/80">
      <div className="group grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-5 sm:px-6">
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
          <span className="text-sm leading-none">▲</span>
          <span>{post.upvotes}</span>
        </button>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-zinc-950 group-hover:text-zinc-900">
              {post.title}
            </h3>
            <button
              type="button"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(nextStatus(post.status))}
              title="Click to change status"
            >
              <Badge
                variant="outline"
                className={cn('border px-2.5 py-1 transition-colors', statusStyles[post.status])}
              >
                {statusMutation.isPending ? '...' : post.status.replace('_', ' ')}
              </Badge>
            </button>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-zinc-500">{post.description}</p>
        </div>

        <div className="flex flex-col items-end justify-between gap-3 pt-0.5 text-right">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm shadow-zinc-900/[0.02] hover:bg-zinc-50"
          >
            <span className="text-zinc-400">◎</span>
            {post.comments} comment{post.comments !== 1 ? 's' : ''}
          </button>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 font-medium text-zinc-500">
              {initials || 'EL'}
            </span>
          </div>
        </div>
      </div>

      {showComments ? (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6">
          {commentsQuery.isPending ? (
            <p className="py-2 text-sm text-zinc-400">Loading comments...</p>
          ) : (
            <div className="space-y-3">
              {commentsQuery.data?.map((c) => (
                <div key={c.id} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-500">
                    {c.authorId.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-zinc-700">{c.body}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim()) commentMutation.mutate(commentText.trim());
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400"
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || commentMutation.isPending}
              className="h-auto px-3 py-1.5 text-xs"
            >
              {commentMutation.isPending ? '...' : 'Send'}
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
