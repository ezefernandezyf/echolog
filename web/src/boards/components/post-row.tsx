import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CaretUp, ChatCircle } from '@phosphor-icons/react';
import { Badge } from '../../shared/components/ui/badge';
import { cn } from '../../shared/lib/cn';
import { postApi } from '../../api/posts';
import { voteApi } from '../../api/votes';
import { commentApi } from '../../api/comments';
import type { ApiError } from '../../api/client';
import { useAuthStore } from '../../auth/auth-store';
import { useWorkspaces } from '../../hooks/use-workspaces';
import { useDeletePost } from '../../hooks/use-posts';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { CommentSection } from './comment-section';
import { updatePostsCache, type PostRowData, type PostsCacheEntry } from './vote-helpers';

export type { PostRowData };

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
  OPEN: 'border-border bg-secondary text-muted-foreground cursor-pointer hover:bg-muted',
  PLANNED: 'border-border bg-muted text-secondary-foreground cursor-pointer hover:bg-secondary',
  IN_PROGRESS: 'border-border bg-card text-secondary-foreground cursor-pointer hover:bg-muted',
  DONE: 'border-border bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
};

export function PostRow({ post, boardId }: PostRowProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.session?.user?.id ?? '');
  const [showComments, setShowComments] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const postsQueryKey = ['posts', boardId] as const;

  // Prevents mutations from overlapping past onSettled (race condition guard)
  const voteLockRef = useRef(false);

  // Reusable callbacks shared by both addVote and removeVote mutations
  const createVoteHandlers = (direction: 'add' | 'remove') => {
    const isAdd = direction === 'add';

    return {
      onMutate: async (): Promise<{
        previousPosts: Array<[readonly unknown[], PostRowData[] | undefined]> | undefined;
      }> => {
        if (voteLockRef.current) return { previousPosts: undefined };

        await queryClient.cancelQueries({ queryKey: postsQueryKey });

        const previousPosts = queryClient.getQueriesData<PostRowData[]>({
          queryKey: postsQueryKey,
        });

        queryClient.setQueriesData<PostsCacheEntry>({ queryKey: postsQueryKey }, (old) =>
          updatePostsCache(old, (p) =>
            p.id === post.id
              ? {
                  ...p,
                  upvotes: isAdd ? p.upvotes + 1 : p.upvotes - 1,
                  isUpvoted: isAdd,
                }
              : p,
          ),
        );

        return { previousPosts };
      },

      onSuccess: (data: { voteCount: number; voted: boolean }) => {
        toast.success(data.voted ? 'Vote added' : 'Vote removed');
        queryClient.setQueriesData<PostsCacheEntry>({ queryKey: postsQueryKey }, (old) =>
          updatePostsCache(old, (p) =>
            p.id === post.id ? { ...p, upvotes: data.voteCount, isUpvoted: data.voted } : p,
          ),
        );
      },

      onError: (
        error: unknown,
        _vars: void,
        context:
          | {
              previousPosts: Array<[readonly unknown[], PostRowData[] | undefined]> | undefined;
            }
          | undefined,
      ) => {
        if (context?.previousPosts) {
          for (const [queryKey, previousPosts] of context.previousPosts) {
            queryClient.setQueryData(queryKey, previousPosts);
          }
        } else {
          queryClient.invalidateQueries({ queryKey: postsQueryKey });
        }

        const apiErr = error as Partial<ApiError>;
        const msg =
          apiErr.status === 409
            ? 'Vote state out of sync. Refreshing…'
            : !apiErr.status || apiErr.status === 0
              ? 'Network error. Check your connection.'
              : `Failed to vote${apiErr.message ? `: ${apiErr.message}` : '.'}`;
        toast.error(msg);
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: postsQueryKey });
        voteLockRef.current = false;
      },
    };
  };

  const addVoteMutation = useMutation({
    mutationFn: () => voteApi.addVote(post.id),
    ...createVoteHandlers('add'),
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => voteApi.removeVote(post.id),
    ...createVoteHandlers('remove'),
  });

  const voteIsPending = addVoteMutation.isPending || removeVoteMutation.isPending;

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => postApi.updateStatus(boardId, post.id, newStatus),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: postsQueryKey });
      const previousPosts = queryClient.getQueryData<PostRowData[]>(postsQueryKey);

      queryClient.setQueriesData<PostsCacheEntry>({ queryKey: postsQueryKey }, (old) =>
        updatePostsCache(old, (p) => (p.id === post.id ? { ...p, status: newStatus } : p)),
      );

      return { previousPosts };
    },
    onSuccess: (_data, newStatus) => {
      toast.success(`Post status changed to ${newStatus.replace('_', ' ')}`);
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsQueryKey, context.previousPosts);
      }
      toast.error('Failed to update status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => commentApi.list(post.id),
    enabled: showComments,
  });

  // ── Delete ────────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const workspaceQuery = useWorkspaces(currentUserId);
  const workspaceRole = Array.isArray(workspaceQuery.data)
    ? workspaceQuery.data.find((w) => w.id === workspaceId)?.role
    : null;
  const isAuthor = currentUserId === post.author;
  const canDelete = isAuthor || workspaceRole === 'ADMIN' || workspaceRole === 'OWNER';

  const deleteMutation = useDeletePost();

  const handleDelete = () => {
    deleteMutation.mutate(
      { boardId, postId: post.id },
      {
        onError: () => {
          toast.error('Failed to delete post');
        },
      },
    );
    setShowDeleteConfirm(false);
  };

  const initials = (post.author ?? post.title)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article className="border-b border-border bg-card transition-colors hover:bg-secondary/80">
      <div className="group grid grid-cols-[auto_1fr_auto] gap-4 px-3 py-4 sm:px-4 sm:py-5">
        <button
          type="button"
          disabled={voteIsPending || voteLockRef.current}
          onClick={() => {
            setJustVoted(true);
            setTimeout(() => setJustVoted(false), 300);
            if (post.isUpvoted) {
              removeVoteMutation.mutate();
            } else {
              addVoteMutation.mutate();
            }
          }}
          aria-label={`${post.isUpvoted ? 'Remove vote from' : 'Upvote'} ${post.title}`}
          className={cn(
            'flex h-14 w-12 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium tracking-[0.12em] transition-all duration-150 active:scale-95 min-w-[44px] min-h-[44px]',
            voteIsPending && 'animate-pulse',
            justVoted && 'animate-vote-pulse',
            post.isUpvoted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
          )}
        >
          <CaretUp size={16} weight={post.isUpvoted ? 'fill' : 'regular'} />
          <span>{post.upvotes}</span>
        </button>

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/w/${workspaceId}/p/${post.id}`)}
              className="truncate text-base font-semibold tracking-[-0.02em] text-foreground hover:underline group-hover:text-foreground"
            >
              {post.title}
            </button>
            <button
              type="button"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(nextStatus(post.status))}
              aria-label={`Status: ${post.status.replace('_', ' ')}. Click to change`}
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
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{post.description}</p>
        </div>

        <div className="flex flex-col items-end justify-between gap-3 pt-0.5 text-right">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-label={`Toggle comments for ${post.title}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-secondary-foreground shadow-sm shadow-black/[0.02] hover:bg-secondary max-sm:min-h-[44px]"
          >
            <ChatCircle size={16} />
            {post.comments} comment{post.comments !== 1 ? 's' : ''}
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Delete post ${post.title}`}
                className="inline-flex items-center justify-center rounded-full border border-border bg-card p-2 text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-colors max-sm:min-h-[44px] max-sm:min-w-[44px]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )}
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted font-medium text-muted-foreground">
              {initials || 'EL'}
            </span>
          </div>
        </div>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          comments={commentsQuery.data ?? []}
          isLoading={commentsQuery.isPending}
          isError={commentsQuery.isError}
          onRetry={() => commentsQuery.refetch()}
          currentUserId={currentUserId}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </article>
  );
}
