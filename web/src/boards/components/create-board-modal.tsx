'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUiStore } from '../../core/store/ui-store';
import { useAuthStore } from '../../auth/auth-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import { toast } from 'sonner';
import { slugify } from '../../../../shared/lib/slugify';
import { useWorkspaces } from '../../hooks/use-workspaces';
import { useCreateBoard } from '../../hooks/use-boards';
import { BoardRequestForm } from './board-request-form';
import { createBoardSchema } from '../../../../shared/contracts/index.js';

interface CreateBoardModalProps {
  workspaceId: string;
}

export function CreateBoardModal({ workspaceId }: CreateBoardModalProps) {
  const open = useUiStore((state) => state.activeModal === 'create-board');
  const closeModal = useUiStore((state) => state.closeModal);
  const userId = useAuthStore((state) => state.session?.user?.id);

  const [showRequestForm, setShowRequestForm] = useState(false);

  // Look up workspace data to check creation policy
  const workspacesQuery = useWorkspaces(userId);
  const workspace = Array.isArray(workspacesQuery.data)
    ? workspacesQuery.data.find((w) => w.id === workspaceId)
    : null;

  const boardCreationPolicy = workspace?.boardCreationPolicy ?? 'FREE';
  const userRole = workspace?.role;

  // ADMINS_ONLY: hide for non-admin/owner
  const isAdminOrOwner = userRole === 'OWNER' || userRole === 'ADMIN';
  if (boardCreationPolicy === 'ADMINS_ONLY' && !isAdminOrOwner) {
    // Don't render the modal — return empty fragment so uiStore still handles open/close
    if (open) closeModal();
    return null;
  }

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<z.input<typeof createBoardSchema>, undefined, z.output<typeof createBoardSchema>>({
    resolver: zodResolver(createBoardSchema),
  });

  const name = watch('name', '') as string;
  const description = watch('description', '') as string;

  const createBoardMutation = useCreateBoard();

  const handleRequestApproval = () => {
    setShowRequestForm(true);
  };

  const handleRequestFormClose = () => {
    setShowRequestForm(false);
  };

  // APPROVAL_REQUIRED: show request form or button to open it
  return (
    <>
      <Modal open={open && !showRequestForm} onClose={closeModal} aria-label="Create Board">
        <form
          className="space-y-6"
          onSubmit={handleSubmit((data) => {
            createBoardMutation.mutate(
              { workspaceId, data },
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
              EchoLog
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {boardCreationPolicy === 'APPROVAL_REQUIRED' && !isAdminOrOwner
                ? 'Request Board'
                : 'Create Board'}
            </h2>
          </div>

          {boardCreationPolicy === 'APPROVAL_REQUIRED' && !isAdminOrOwner ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Board creation requires admin approval in this workspace. Submit a request below.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary/90 active:bg-primary/80"
                  onClick={handleRequestApproval}
                >
                  Request Approval
                </Button>
              </div>
            </div>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-secondary-foreground">Board Name</span>
                <Input
                  id="create-board-name"
                  placeholder="Feature Requests"
                  autoComplete="off"
                  maxLength={120}
                  aria-describedby={errors.name ? 'create-board-name-error' : undefined}
                  aria-invalid={errors.name ? true : undefined}
                  {...register('name')}
                />
                {name.trim() ? (
                  <p className="text-xs text-muted-foreground">Slug: {slugify(name)}</p>
                ) : null}
                <CharCounter current={name.length} max={120} />
                {errors.name ? (
                  <p id="create-board-name-error" role="alert" className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-secondary-foreground">
                  Description (optional)
                </span>
                <Input
                  id="create-board-description"
                  placeholder="Collect and prioritize feature ideas"
                  maxLength={500}
                  aria-describedby={errors.description ? 'create-board-description-error' : undefined}
                  aria-invalid={errors.description ? true : undefined}
                  {...register('description')}
                />
                <CharCounter current={description?.length ?? 0} max={500} />
                {errors.description ? (
                  <p
                    id="create-board-description-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.description.message}
                  </p>
                ) : null}
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  disabled={createBoardMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 active:bg-primary/80"
                  disabled={createBoardMutation.isPending || !isDirty}
                >
                  {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {showRequestForm ? (
        <BoardRequestForm
          workspaceId={workspaceId}
          open={showRequestForm}
          onClose={handleRequestFormClose}
        />
      ) : null}
    </>
  );
}
