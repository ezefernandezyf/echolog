'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { boardApi } from '../../core/api-client';
import type { CreateBoardDTO } from '../../../../shared/contracts/index.js';
import { createBoardSchema } from '../../../../shared/contracts/index.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CreateBoardModalProps {
  workspaceId: string;
}

export function CreateBoardModal({ workspaceId }: CreateBoardModalProps) {
  const queryClient = useQueryClient();
  const open = useUiStore((state) => state.activeModal === 'create-board');
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBoardDTO & { slug?: string }>({
    resolver: zodResolver(createBoardSchema),
  });

  const name = watch('name', '');

  const mutation = useMutation({
    mutationFn: (data: CreateBoardDTO) =>
      boardApi.create(workspaceId, {
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      reset();
      closeModal();
    },
  });

  return (
    <Modal open={open} onClose={closeModal}>
      <form className="space-y-6" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">EchoLog</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Create Board</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Board Name</span>
          <Input placeholder="Feature Requests" autoComplete="off" {...register('name')} />
          {name.trim() ? (
            <p className="text-xs text-zinc-400">Slug: {slugify(name)}</p>
          ) : null}
          {errors.name ? (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Description (optional)</span>
          <Input placeholder="Collect and prioritize feature ideas" {...register('description')} />
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : null}
        </label>

        {mutation.error ? (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Failed to create board'}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? 'Creating...' : 'Create Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
