'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import { cn } from '../../shared/lib/cn';
import { useCreatePost } from '../../hooks/use-posts';
import type { CreatePostDTO } from '../../../../shared/contracts/index.js';
import { createPostSchema } from '../../../../shared/contracts/index.js';

interface CreatePostModalProps {
  boardId?: string;
}

export function CreatePostModal({ boardId }: CreatePostModalProps) {
  const open = useUiStore((state) => state.activeModal === 'create-post');
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CreatePostDTO>({
    resolver: zodResolver(createPostSchema),
  });

  const title = watch('title', '');

  const createPostMutation = useCreatePost();

  return (
    <Modal open={open} onClose={closeModal} className="max-w-2xl" aria-label="Submit new feedback">
      <form
        className="space-y-6"
        onSubmit={handleSubmit((data) => {
          if (!boardId) return;
          createPostMutation.mutate(
            { boardId, data },
            {
              onSuccess: () => {
                reset();
                closeModal();
              },
              onError: (error) => {
                const fallback = mapServerErrors(error, setError);
                if (fallback) {
                  toast.error(fallback);
                }
              },
            },
          );
        })}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            New Feedback
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Submit new feedback
          </h2>
        </div>

        {!boardId ? (
          <p className="text-sm text-destructive">Select a board first to create a post.</p>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-secondary-foreground">Title</span>
          <Input
            id="create-post-title"
            placeholder="Add dark mode"
            maxLength={120}
            aria-describedby={errors.title ? 'create-post-title-error' : undefined}
            aria-invalid={errors.title ? true : undefined}
            {...register('title')}
          />
          <CharCounter current={title.length} max={120} />
          {errors.title ? (
            <p id="create-post-title-error" role="alert" className="text-sm text-destructive">
              {errors.title.message}
            </p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-secondary-foreground">Details</span>
          <textarea
            id="create-post-body"
            placeholder="Tell us what you'd like to improve..."
            rows={6}
            aria-describedby={errors.body ? 'create-post-body-error' : undefined}
            aria-invalid={errors.body ? true : undefined}
            className={cn(
              'flex w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm shadow-black/[0.02] transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...register('body')}
          />
          {errors.body ? (
            <p id="create-post-body-error" role="alert" className="text-sm text-destructive">
              {errors.body.message}
            </p>
          ) : null}
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={closeModal}
            disabled={createPostMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 active:bg-primary/80"
            disabled={createPostMutation.isPending || !isDirty}
          >
            {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
