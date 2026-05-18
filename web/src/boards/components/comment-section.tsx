import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { commentApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { ErrorAlert } from '../../shared/components/ui/error-alert';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import type { CommentDTO, CreateCommentDTO } from '../../../../shared/contracts/index.js';
import { createCommentSchema } from '../../../../shared/contracts/index.js';

interface CommentItemProps {
  comment: CommentDTO;
  currentUserId: string;
  onDelete?: (commentId: string) => void;
  isDeleting?: boolean;
}

function CommentItem({ comment, currentUserId, onDelete, isDeleting }: CommentItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  const canDelete = comment.authorId === currentUserId;

  const handleDelete = () => {
    setShowDelete(false);
    onDelete?.(comment.id);
  };

  return (
    <div className="flex gap-3 text-sm" role="listitem">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
        {(comment.authorName ?? comment.authorId).slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-zinc-700 dark:text-zinc-300">{comment.body}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </p>
      </div>
      {canDelete && onDelete ? (
        <>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            aria-label={`Delete comment by ${comment.authorName ?? comment.authorId}`}
            className="ml-auto mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <ConfirmDialog
            open={showDelete}
            onClose={() => setShowDelete(false)}
            onConfirm={handleDelete}
            title="Delete comment"
            message="Delete this comment?"
            confirmLabel="Delete"
            isLoading={isDeleting}
          />
        </>
      ) : null}
    </div>
  );
}

interface VirtualizedCommentListProps {
  comments: CommentDTO[];
  currentUserId: string;
  onDelete: (commentId: string) => void;
  isDeletingId: string | null;
}

function VirtualizedCommentList({
  comments,
  currentUserId,
  onDelete,
  isDeletingId,
}: VirtualizedCommentListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60,
    overscan: 3,
  });

  return (
    <div
      ref={scrollRef}
      className="max-h-[400px] overflow-y-auto"
      role="region"
      aria-live="polite"
      aria-label="Comments"
    >
      <div
        style={{
          position: 'relative',
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const comment = comments[virtualItem.index];
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
              className="px-5 py-2"
            >
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                onDelete={onDelete}
                isDeleting={isDeletingId === comment.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
  comments: CommentDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  currentUserId: string;
}

export function CommentSection({
  postId,
  comments,
  isLoading,
  isError,
  onRetry,
  currentUserId,
}: CommentSectionProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateCommentDTO>({
    resolver: zodResolver(createCommentSchema),
  });

  const body = watch('body', '');

  const commentMutation = useMutation({
    mutationFn: (data: CreateCommentDTO) => commentApi.create(postId, data),
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      reset();
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(postId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previous = queryClient.getQueryData<CommentDTO[]>(['comments', postId]);
      queryClient.setQueryData<CommentDTO[]>(['comments', postId], (old) =>
        old ? old.filter((c) => c.id !== commentId) : [],
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Comment deleted');
    },
    onError: (error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comments', postId], context.previous);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleDelete = (commentId: string) => {
    deleteMutation.mutate(commentId);
  };

  if (isLoading) {
    return (
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="space-y-3 py-2" aria-hidden="true">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 size-6 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <ErrorAlert
          message="Failed to load comments"
          onRetry={onRetry}
          retryLabel="Retry"
          className="rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      {comments.length > 0 ? (
        comments.length > 10 ? (
          <VirtualizedCommentList
            comments={comments}
            currentUserId={currentUserId}
            onDelete={handleDelete}
            isDeletingId={deleteMutation.isPending ? (deleteMutation.variables as string) : null}
          />
        ) : (
          <div className="space-y-3" role="region" aria-live="polite" aria-label="Comments">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === c.id}
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No comments yet. Be the first to share your thoughts.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => commentMutation.mutate(data))}
        className="mt-3 flex gap-2"
      >
        <div className="flex-1">
          <input
            id="comment-body-input"
            type="text"
            placeholder="Add a comment..."
            aria-label="Add a comment"
            maxLength={500}
            aria-describedby={errors.body ? 'comment-body-input-error' : undefined}
            aria-invalid={errors.body ? true : undefined}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-base outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-card dark:text-foreground dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
            {...register('body')}
          />
          <CharCounter current={body.length} max={500} />
          {errors.body ? (
            <p id="comment-body-input-error" role="alert" className="text-sm text-red-600">
              {errors.body.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={commentMutation.isPending || !body.trim()}
          className="h-auto px-3 py-1.5 text-xs"
        >
          {commentMutation.isPending ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
