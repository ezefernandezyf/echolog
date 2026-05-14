'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import { slugify } from '../../../../shared/lib/slugify';
import { workspaceApi } from '../../core/api-client';
import type { UpdateWorkspaceDTO, WorkspaceDTO } from '../../../../shared/contracts/index.js';
import { updateWorkspaceSchema } from '../../../../shared/contracts/index.js';

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get workspace from the query cache
  const workspaceQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
    staleTime: 60_000,
  });

  const workspace =
    Array.isArray(workspaceQuery.data)
      ? workspaceQuery.data.find((w) => w.id === workspaceId)
      : null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof updateWorkspaceSchema>, undefined, z.output<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspace
      ? { name: workspace.name, slug: workspace.slug }
      : undefined,
  });

  const name = watch('name', '') as string;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateWorkspaceDTO) => workspaceApi.update(workspaceId!, data),
    onSuccess: (data) => {
      toast.success('Workspace updated');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      reset({ name: data.name, slug: data.slug });
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.delete(workspaceId!),
    onSuccess: () => {
      toast.success('Workspace deleted');
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      navigate('/w', { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete workspace');
    },
  });

  if (workspaceQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-card">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Workspace not found</p>
          <Link to="/w" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
            Back to workspaces
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/w" className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
            Workspaces
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <Link
            to={`/w/${workspaceId}`}
            className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {workspace.name}
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-900 dark:text-zinc-100">Settings</span>
        </div>

        {/* General Settings */}
        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">General</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Update your workspace name and URL slug.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit((data) => {
              // Only send changed fields
              const changed: UpdateWorkspaceDTO = {};
              if (data.name !== workspace.name) changed.name = data.name;
              if (data.slug !== workspace.slug) changed.slug = data.slug;
              if (Object.keys(changed).length === 0) return;
              updateMutation.mutate(changed);
            })}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Workspace Name</span>
              <Input placeholder="Northstar Labs" autoComplete="off" maxLength={120} {...register('name')} />
              {name.trim() ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Slug: {slugify(name)}</p>
              ) : null}
              <CharCounter current={name.length} max={120} />
              {errors.name ? (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug</span>
              <Input placeholder="northstar-labs" autoComplete="off" maxLength={120} {...register('slug')} />
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Used in URLs: echolog.app/w/{workspace.slug}
              </p>
              {errors.slug ? (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending || !isDirty}
                className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-card">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Permanently delete this workspace and all its data. This action cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-500"
          >
            Delete Workspace
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Workspace"
        message={`This will permanently delete the workspace "${workspace.name}" and all its boards, posts, comments, and votes. This action cannot be undone.`}
        confirmLabel="Delete Workspace"
        confirmInput={workspace.name}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
