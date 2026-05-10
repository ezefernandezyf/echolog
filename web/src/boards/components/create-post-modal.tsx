'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { cn } from '../../shared/lib/cn';
import { postApi } from '../../core/api-client';
import type { CreatePostDTO } from '../../../../shared/contracts/index.js';
import { createPostSchema } from '../../../../shared/contracts/index.js';

interface CreatePostModalProps {
  boardId?: string;
}

export function CreatePostModal({ boardId }: CreatePostModalProps) {
  const queryClient = useQueryClient();
  const open = useUiStore((state) => state.activeModal === 'create-post');
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostDTO>({
    resolver: zodResolver(createPostSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePostDTO) => {
      if (!boardId) throw new Error('No board selected');
      return postApi.create(boardId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', boardId] });
      reset();
      closeModal();
    },
  });

  return (
    <Modal open={open} onClose={closeModal} className="max-w-2xl">
      <form className="space-y-6" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            New Feedback
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Submit new feedback
          </h2>
        </div>

        {!boardId ? (
          <p className="text-sm text-red-600">Select a board first to create a post.</p>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <Input placeholder="Add dark mode" {...register('title')} />
          {errors.title ? (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Details</span>
          <textarea
            placeholder="Tell us what you'd like to improve..."
            rows={6}
            className={cn(
              'flex w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm shadow-black/[0.02] transition-colors placeholder:text-muted-foreground focus-visible:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            )}
            {...register('body')}
          />
          {errors.body ? (
            <p className="text-sm text-red-600">{errors.body.message}</p>
          ) : null}
        </label>

        {mutation.error ? (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to create post'}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900"
            disabled={mutation.isPending || !boardId}
          >
            {mutation.isPending ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
