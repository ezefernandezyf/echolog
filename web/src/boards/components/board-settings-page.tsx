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
import { boardApi } from '../../core/api-client';
import type { UpdateBoardDTO } from '../../../../shared/contracts/index.js';
import { updateBoardSchema } from '../../../../shared/contracts/index.js';
import { PageTitle } from '../../core/page-title';

export function BoardSettingsPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
  });

  const board = Array.isArray(boardsQuery.data)
    ? boardsQuery.data.find((b) => b.id === boardId)
    : null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof updateBoardSchema>, undefined, z.output<typeof updateBoardSchema>>({
    resolver: zodResolver(updateBoardSchema),
    values: board
      ? { name: board.name, slug: board.slug, description: board.description ?? '' }
      : undefined,
  });

  const name = watch('name', '') as string;
  const description = watch('description', '') as string;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBoardDTO) => boardApi.update(workspaceId!, boardId!, data),
    onSuccess: (data) => {
      toast.success('Board updated');
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      reset({ name: data.name, slug: data.slug, description: data.description ?? '' });
    },
    onError: (error) => {
      const fallback = mapServerErrors(error, setError);
      if (fallback) {
        toast.error(fallback);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => boardApi.delete(workspaceId!, boardId!),
    onSuccess: () => {
      toast.success('Board deleted');
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] });
      navigate(`/w/${workspaceId}`, { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete board');
    },
  });

  if (boardsQuery.isPending) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (!board) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">Board not found</p>
          <Link
            to={`/w/${workspaceId}`}
            className="mt-4 inline-block text-sm font-medium text-foreground underline"
          >
            Back to board
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
      <PageTitle title="Board Settings" />
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            to="/w"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Workspaces
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link
            to={`/w/${workspaceId}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Board
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground" aria-current="page">
            Settings
          </span>
        </nav>

        {/* General Settings */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            <p className="text-sm text-muted-foreground">
              Update your board name, slug, and description.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit((data) => {
              const changed: UpdateBoardDTO = {};
              if (data.name !== board.name) changed.name = data.name;
              if (data.slug !== board.slug) changed.slug = data.slug;
              if (data.description !== (board.description ?? ''))
                changed.description = data.description || null;
              if (Object.keys(changed).length === 0) return;
              updateMutation.mutate(changed);
            })}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                Board Name
              </span>
              <Input
                id="board-settings-name"
                placeholder="Feature Requests"
                autoComplete="off"
                maxLength={120}
                aria-describedby={errors.name ? 'board-settings-name-error' : undefined}
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
              {name.trim() ? (
                <p className="text-xs text-muted-foreground">Slug: {slugify(name)}</p>
              ) : null}
              <CharCounter current={name.length} max={120} />
              {errors.name ? (
                <p id="board-settings-name-error" role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">Slug</span>
              <Input
                id="board-settings-slug"
                placeholder="feature-requests"
                autoComplete="off"
                maxLength={120}
                aria-describedby={errors.slug ? 'board-settings-slug-error' : undefined}
                aria-invalid={errors.slug ? true : undefined}
                {...register('slug')}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: /w/acme/feature-requests
              </p>
              {errors.slug ? (
                <p id="board-settings-slug-error" role="alert" className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">
                Description
              </span>
              <Input
                id="board-settings-description"
                placeholder="Collect and prioritize feature ideas"
                maxLength={500}
                aria-describedby={
                  errors.description ? 'board-settings-description-error' : undefined
                }
                aria-invalid={errors.description ? true : undefined}
                {...register('description')}
              />
              <CharCounter current={description?.length ?? 0} max={500} />
              {errors.description ? (
                <p
                  id="board-settings-description-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.description.message}
                </p>
              ) : null}
            </label>

            {updateMutation.error ? (
              <p className="text-sm text-destructive">
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'Failed to update board'}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending || !isDirty}
                className="bg-primary hover:bg-primary/90 active:bg-primary/80"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 rounded-2xl border border-destructive/20 bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete this board and all its posts, comments, and votes. This action
              cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80"
          >
            Delete Board
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Board"
        message={`This will permanently delete the board "${board.name}" and all its posts, comments, and votes. This action cannot be undone.`}
        confirmLabel="Delete Board"
        confirmInput={board.name}
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
