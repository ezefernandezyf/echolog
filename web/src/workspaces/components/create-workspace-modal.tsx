'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import { workspaceApi } from '../../core/api-client';
import { slugify } from '../../../../shared/lib/slugify';
import type { CreateWorkspaceDTO } from '../../../../shared/contracts/index.js';
import { createWorkspaceSchema } from '../../../../shared/contracts/index.js';

export function CreateWorkspaceModal() {
  const queryClient = useQueryClient();
  const open = useUiStore((state) => state.activeModal === 'create-workspace');
  const closeModal = useUiStore((state) => state.closeModal);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CreateWorkspaceDTO>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const name = watch('name', '');

  const mutation = useMutation({
    mutationFn: (data: CreateWorkspaceDTO) => workspaceApi.create(data),
    onSuccess: () => {
      toast.success('Workspace created');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      reset();
      closeModal();
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  return (
    <Modal open={open} onClose={closeModal} aria-label="Create Workspace">
      <form className="space-y-6" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            EchoLog
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
            Create Workspace
          </h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Workspace Name
          </span>
          <Input
            id="create-workspace-name"
            placeholder="Northstar Labs"
            autoComplete="off"
            maxLength={120}
            aria-describedby={errors.name ? 'create-workspace-name-error' : undefined}
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          {name.trim() ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Slug: {slugify(name)}</p>
          ) : null}
          <CharCounter current={name.length} max={120} />
          {errors.name ? (
            <p id="create-workspace-name-error" role="alert" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          ) : null}
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
            disabled={mutation.isPending || !isDirty}
          >
            {mutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
