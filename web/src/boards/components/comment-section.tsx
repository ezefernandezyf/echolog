import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentApi } from '../../core/api-client';
import { Button } from '../../shared/components/ui/button';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import type { CommentDTO, CreateCommentDTO } from '../../../../shared/contracts/index.js';
import { createCommentSchema } from '../../../../shared/contracts/index.js';

interface CommentSectionProps {
  postId: string;
  comments: CommentDTO[];
  isLoading: boolean;
}

export function CommentSection({ postId, comments, isLoading }: CommentSectionProps) {
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

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      {comments.length > 0 ? (
        <div className="space-y-3" role="region" aria-live="polite" aria-label="Comments">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                {(c.authorName ?? c.authorId).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-zinc-700 dark:text-zinc-300">{c.body}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
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
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-card dark:text-foreground dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
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
