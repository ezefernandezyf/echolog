'use client';

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { publicApi } from '../api/public';
import { voteApi } from '../api/votes';
import { commentApi } from '../api/comments';
import { queryKeys } from '../hooks/query-keys';
import { useAuthStore } from '../auth/auth-store';
import { CommentSection } from '../boards/components/comment-section';
import type { PostDTO } from '../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// PublicPostRow — interactive post row gated by access level
// ---------------------------------------------------------------------------
interface PublicPostRowProps {
  post: PostDTO;
  boardId: string;
  workspaceSlug: string;
  accessLevel: 'READ_ONLY' | 'INTERACT' | 'FULL';
  isAuthenticated: boolean;
}

function PublicPostRow({ post, workspaceSlug, accessLevel, isAuthenticated }: PublicPostRowProps) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.session?.user?.id ?? '');

  const canWrite = isAuthenticated && (accessLevel === 'INTERACT' || accessLevel === 'FULL');

  // Fetch comments when section is expanded
  const commentsQuery = useQuery({
    queryKey: queryKeys.comments.list(post.id),
    queryFn: () => commentApi.list(post.id),
    enabled: showComments,
  });

  // Vote mutations
  const addVoteMutation = useMutation({
    mutationFn: () => voteApi.addVote(post.id),
    onSuccess: () => {
      toast.success('Vote added');
      queryClient.invalidateQueries({
        queryKey: queryKeys.public.boardDetail(workspaceSlug, ''),
      });
    },
    onError: () => {
      toast.error('Failed to vote');
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => voteApi.removeVote(post.id),
    onSuccess: () => {
      toast.success('Vote removed');
      queryClient.invalidateQueries({
        queryKey: queryKeys.public.boardDetail(workspaceSlug, ''),
      });
    },
    onError: () => {
      toast.error('Failed to remove vote');
    },
  });

  const handleVote = () => {
    if (post.isUpvoted) {
      removeVoteMutation.mutate();
    } else {
      addVoteMutation.mutate();
    }
  };

  const votePending = addVoteMutation.isPending || removeVoteMutation.isPending;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm">
      <h3 className="font-semibold text-foreground">{post.title}</h3>
      {post.body ? (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.body}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {canWrite ? (
          <button
            type="button"
            disabled={votePending}
            onClick={handleVote}
            aria-label={`Upvote ${post.title}`}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50 min-w-[44px] min-h-[44px]"
          >
            <span className="text-sm leading-none">{post.isUpvoted ? '▼' : '▲'}</span>
            <strong className="text-foreground">{post.voteCount}</strong>
          </button>
        ) : (
          <span>
            <strong className="text-foreground">{post.voteCount}</strong> vote
            {post.voteCount !== 1 ? 's' : ''}
          </span>
        )}

        {canWrite ? (
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-label={`Toggle comments for ${post.title}`}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 transition-colors hover:border-primary/30 hover:text-foreground min-w-[44px] min-h-[44px]"
          >
            <span className="text-muted-foreground">◎</span>
            <strong className="text-foreground">{post.commentCount}</strong> comment
            {post.commentCount !== 1 ? 's' : ''}
          </button>
        ) : (
          <span>
            <strong className="text-foreground">{post.commentCount}</strong> comment
            {post.commentCount !== 1 ? 's' : ''}
          </span>
        )}

        {post.authorName ? <span>by {post.authorName}</span> : null}
      </div>

      {showComments && (
        <div className="mt-3 border-t border-border pt-3">
          <CommentSection
            postId={post.id}
            comments={commentsQuery.data ?? []}
            isLoading={commentsQuery.isPending}
            isError={commentsQuery.isError}
            onRetry={() => commentsQuery.refetch()}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PublicBoardView
// ---------------------------------------------------------------------------
export function PublicBoardView() {
  const { slug, boardSlug } = useParams<{ slug: string; boardSlug: string }>();
  const session = useAuthStore((state) => state.session);
  const isAuthenticated = !!session;

  // Parallel fetch: board detail + workspace detail (for accessLevel)
  const {
    data: board,
    isPending: boardPending,
    isError: boardError,
  } = useQuery({
    queryKey: queryKeys.public.boardDetail(slug ?? '', boardSlug ?? ''),
    queryFn: () => publicApi.getBoardBySlug(slug!, boardSlug!),
    enabled: !!slug && !!boardSlug,
    staleTime: 30_000,
  });

  const { data: workspace, isPending: workspacePending } = useQuery({
    queryKey: queryKeys.public.workspaceDetail(slug ?? ''),
    queryFn: () => publicApi.getWorkspaceBySlug(slug!),
    enabled: !!slug,
    staleTime: 30_000,
  });

  const accessLevel: 'READ_ONLY' | 'INTERACT' | 'FULL' =
    workspace?.publicAccessLevel ?? 'READ_ONLY';
  const canCreatePost = isAuthenticated && accessLevel === 'FULL';

  if (boardPending) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-96 animate-pulse rounded-md bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </main>
    );
  }

  if (boardError || !board) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-3 text-sm text-muted-foreground">Board not found.</p>
          <Link
            to="/explore"
            className="mt-4 inline-block text-sm font-medium text-foreground underline"
          >
            Back to discovery
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-4 py-10 animate-fade-in">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm">
        <Link
          to="/explore"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Discover
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link
          to={`/explore/${slug}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {slug}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground" aria-current="page">
          {board.name}
        </span>
      </nav>

      {/* Board header */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
              {board.name}
            </h1>
            {board.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{board.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">{board.postCount}</strong> post
              {board.postCount !== 1 ? 's' : ''}
            </p>
          </div>

          {canCreatePost && (
            <Link
              to={`/w/create-post?board=${board.id}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              Create post
            </Link>
          )}
        </div>

        {/* Access-level notice when workspace data is loaded */}
        {!workspacePending && workspace && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {!isAuthenticated
                ? 'Sign in to interact with posts.'
                : accessLevel === 'READ_ONLY'
                  ? 'This workspace is read-only.'
                  : accessLevel === 'INTERACT'
                    ? 'You can vote and comment on posts.'
                    : 'Full access: vote, comment, and create posts.'}
            </p>
          </div>
        )}
      </div>

      {/* Posts list */}
      {board.posts.length > 0 ? (
        <div className="space-y-3">
          {board.posts.map((post) => (
            <PublicPostRow
              key={post.id}
              post={post}
              boardId={board.id}
              workspaceSlug={slug ?? ''}
              accessLevel={accessLevel}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No posts yet in this board.</p>
        </div>
      )}
    </main>
  );
}
