'use client';

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public';
import { queryKeys } from '../hooks/query-keys';
import type { PostDTO } from '../../../shared/contracts/index.js';

function PostRow({ post }: { post: PostDTO }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm">
      <h3 className="font-semibold text-foreground">{post.title}</h3>
      {post.body ? (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.body}</p>
      ) : null}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{post.voteCount}</strong> vote{post.voteCount !== 1 ? 's' : ''}
        </span>
        <span>
          <strong className="text-foreground">{post.commentCount}</strong> comment{post.commentCount !== 1 ? 's' : ''}
        </span>
        {post.authorName ? <span>by {post.authorName}</span> : null}
      </div>
    </div>
  );
}

export function PublicBoardView() {
  const { slug, boardSlug } = useParams<{ slug: string; boardSlug: string }>();

  const { data: board, isPending, isError } = useQuery({
    queryKey: queryKeys.public.boardDetail(slug ?? '', boardSlug ?? ''),
    queryFn: () => publicApi.getBoardBySlug(slug!, boardSlug!),
    enabled: !!slug && !!boardSlug,
    staleTime: 30_000,
  });

  if (isPending) {
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

  if (isError || !board) {
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
        <Link to="/explore" className="text-muted-foreground transition-colors hover:text-foreground">
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
        <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
          {board.name}
        </h1>
        {board.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{board.description}</p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">
          <strong className="text-foreground">{board.postCount}</strong> post{board.postCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Posts list */}
      {board.posts.length > 0 ? (
        <div className="space-y-3">
          {board.posts.map((post) => (
            <PostRow key={post.id} post={post} />
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
