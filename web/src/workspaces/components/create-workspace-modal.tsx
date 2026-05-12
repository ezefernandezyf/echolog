'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { workspaceApi } from '../../core/api-client';
import type { CreateWorkspaceDTO } from '../../../../shared/contracts/index.js';
import { createWorkspaceSchema } from '../../../../shared/contracts/index.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateWorkspaceModal() {
  const queryClient = useQueryClient();
  const open = useUiStore((state) => state.activeModal === 'create-workspace');
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceDTO & { slug?: string }>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const name = watch('name', '');

  // Auto-populate slug from name so Zod validation passes
  useEffect(() => {
    setValue('slug', slugify(name), { shouldValidate: true });
  }, [name, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CreateWorkspaceDTO) =>
      workspaceApi.create({ name: data.name, slug: slugify(data.name) }),
    onSuccess: () => {
      toast.success('Workspace created');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      reset();
      closeModal();
    },
  });

  return (
    <Modal open={open} onClose={closeModal}>
      <form className="space-y-6" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">EchoLog</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">Create Workspace</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Workspace Name</span>
          <Input
            placeholder="Northstar Labs"
            autoComplete="off"
            {...register('name')}
          />
          {name.trim() ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Slug: {slugify(name)}</p>
          ) : null}
          {errors.name ? (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          ) : errors.slug ? (
            <p className="text-sm text-red-600">{errors.slug.message}</p>
          ) : null}
        </label>

        {mutation.error ? (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to create workspace'}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
