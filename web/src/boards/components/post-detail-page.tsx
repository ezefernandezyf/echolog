import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { cn } from '../../shared/lib/cn';
import { postApi } from '../../api/posts';
import { voteApi } from '../../api/votes';
import { commentApi } from '../../api/comments';
import { useAuthStore } from '../../auth/auth-store';
import type { ApiError } from '../../api/client';
import type { PostDTO } from '../../../../shared/contracts/index.js';
import { CommentSection } from './comment-section';
import { PostSkeleton } from '../../shared/components/domain-skeletons';
import { updatePostsCache, type PostsCacheEntry } from './vote-helpers';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
import { PageTitle } from '../../core/page-title';

const statusStyles: Record<string, string> = {
  OPEN: 'border-border bg-secondary text-muted-foreground',
  PLANNED: 'border-border bg-muted text-secondary-foreground',
  IN_PROGRESS: 'border-border bg-card text-secondary-foreground',
  DONE: 'border-border bg-primary text-primary-foreground',
};

export function PostDetailPage() {
  const navigate = useNavigate();
  const { workspaceId, postId } = useParams<{ workspaceId: string; postId: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.session?.user?.id ?? '');

  const {
    data: post,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['post', postId] as const,
    queryFn: () => postApi.getById(postId!),
    enabled: !!postId,
  });

  const postQueryKey = ['post', postId] as const;
  const postsQueryKey = post?.boardId ? (['posts', post.boardId] as const) : null;

  const commentsQuery = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentApi.list(postId!),
    enabled: !!postId,
  });

  const addVoteMutation = useMutation({
    mutationFn: () => voteApi.addVote(postId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postQueryKey });
      const previousPost = queryClient.getQueryData<PostDTO>(postQueryKey);

      queryClient.setQueryData<PostDTO>(postQueryKey, (old) =>
        old ? { ...old, voteCount: old.voteCount + 1, isUpvoted: true } : old,
      );

      return { previousPost };
    },
    onSuccess: (data) => {
      toast.success('Vote added');
      queryClient.setQueryData<PostDTO>(postQueryKey, (old) =>
        old ? { ...old, voteCount: data.voteCount, isUpvoted: data.voted } : old,
      );
      if (postsQueryKey) {
        queryClient.setQueriesData<PostsCacheEntry>({ queryKey: postsQueryKey }, (old) =>
          updatePostsCache(old, (row) =>
            row.id === postId ? { ...row, upvotes: data.voteCount, isUpvoted: data.voted } : row,
          ),
        );
      }
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(postQueryKey, context.previousPost);
      }
      const apiErr = err as Partial<ApiError>;
      const msg =
        apiErr?.status === 409
          ? 'Vote state out of sync. Refreshing…'
          : `Failed to vote${apiErr?.message ? `: ${apiErr.message}` : '.'}`;
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postQueryKey });
      if (postsQueryKey) {
        queryClient.invalidateQueries({ queryKey: postsQueryKey });
      }
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => voteApi.removeVote(postId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postQueryKey });
      const previousPost = queryClient.getQueryData<PostDTO>(postQueryKey);

      queryClient.setQueryData<PostDTO>(postQueryKey, (old) =>
        old ? { ...old, voteCount: Math.max(0, old.voteCount - 1), isUpvoted: false } : old,
      );

      return { previousPost };
    },
    onSuccess: (data) => {
      toast.success('Vote removed');
      queryClient.setQueryData<PostDTO>(postQueryKey, (old) =>
        old ? { ...old, voteCount: data.voteCount, isUpvoted: data.voted } : old,
      );
      if (postsQueryKey) {
        queryClient.setQueriesData<PostsCacheEntry>({ queryKey: postsQueryKey }, (old) =>
          updatePostsCache(old, (row) =>
            row.id === postId ? { ...row, upvotes: data.voteCount, isUpvoted: data.voted } : row,
          ),
        );
      }
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(postQueryKey, context.previousPost);
      }
      const apiErr = err as Partial<ApiError>;
      const msg =
        apiErr?.status === 409
          ? 'Vote state out of sync. Refreshing…'
          : `Failed to vote${apiErr?.message ? `: ${apiErr.message}` : '.'}`;
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postQueryKey });
      if (postsQueryKey) {
        queryClient.invalidateQueries({ queryKey: postsQueryKey });
      }
    },
  });

  const voteIsPending = addVoteMutation.isPending || removeVoteMutation.isPending;

  useFocusOnMount('h1');

  if (isPending) {
    return (
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <PostSkeleton />
      </main>
    );
  }

  if (isError) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-4"
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-destructive/20 bg-destructive/10 px-6 py-16 text-center">
          <p className="text-sm text-destructive">
            {(error as Partial<ApiError>)?.message ?? 'Failed to load post'}
          </p>
          <Button variant="outline" onClick={() => navigate(`/w/${workspaceId}`)}>
            Back to board
          </Button>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-4"
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm shadow-black/[0.02]">
          <p className="text-sm text-muted-foreground">
            Post not found. It may have been removed or the link is incorrect.
          </p>
          <Button variant="outline" onClick={() => navigate(`/w/${workspaceId}`)}>
            Back to board
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <PageTitle title={post.title} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(`/w/${workspaceId}`)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors max-sm:min-h-[44px]"
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only">Back to board</span>
          Back to board
        </button>

        {/* Post header */}
        <article className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            {/* Vote button */}
            <button
              type="button"
              disabled={voteIsPending}
              onClick={() =>
                post.isUpvoted ? removeVoteMutation.mutate() : addVoteMutation.mutate()
              }
              aria-label={`${post.isUpvoted ? 'Remove vote from' : 'Upvote'} ${post.title}`}
              className={cn(
                'flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] font-medium tracking-[0.12em] transition-all duration-150 active:scale-95 min-w-[44px] min-h-[44px]',
                voteIsPending && 'animate-pulse',
                post.isUpvoted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              <span className="text-sm leading-none">▲</span>
              <span>{post.voteCount}</span>
            </button>

            {/* Title + meta */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold tracking-[-0.03em] text-foreground sm:text-2xl">
                  {post.title}
                </h1>
                <Badge
                  variant="outline"
                  className={cn('border px-2.5 py-1 text-xs', statusStyles[post.status])}
                  aria-label={`Status: ${post.status.replace('_', ' ')}`}
                >
                  {post.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {post.authorName && (
                  <span className="flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium">
                      {post.authorName.slice(0, 2).toUpperCase()}
                    </span>
                    {post.authorName}
                  </span>
                )}
                <span className="text-muted-foreground/50">·</span>
                <span>
                  {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Post body */}
              {post.body && (
                <div className="pt-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
                    {post.body}
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Comments section */}
        <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 sm:px-8 sm:py-5">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">Comments</h2>
          </div>
          <CommentSection
            postId={post.id}
            comments={commentsQuery.data ?? []}
            isLoading={commentsQuery.isPending}
            isError={commentsQuery.isError}
            onRetry={() => commentsQuery.refetch()}
            currentUserId={currentUserId}
          />
        </section>
      </div>
    </main>
  );
}
