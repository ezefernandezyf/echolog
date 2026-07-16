'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { slugify } from '../../../../shared/lib/slugify';
import { useCreateBoardRequest } from '../../hooks/use-board-requests';
import { createBoardRequestSchema } from '../../../../shared/contracts/index.js';

interface BoardRequestFormProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export function BoardRequestForm({ workspaceId, open, onClose }: BoardRequestFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<
    z.input<typeof createBoardRequestSchema>,
    undefined,
    z.output<typeof createBoardRequestSchema>
  >({
    resolver: zodResolver(createBoardRequestSchema),
    defaultValues: { boardName: '', boardSlug: '' },
  });

  const boardName = watch('boardName', '') as string;
  const createRequestMutation = useCreateBoardRequest(workspaceId);

  // Auto-generate slug from board name
  useEffect(() => {
    if (boardName.trim()) {
      setValue('boardSlug', slugify(boardName), { shouldValidate: true });
    } else {
      setValue('boardSlug', '', { shouldValidate: false });
    }
  }, [boardName, setValue]);

  return (
    <Modal open={open} onClose={onClose} aria-label="Request Board">
      <form
        className="space-y-6"
        onSubmit={handleSubmit((data) => {
          createRequestMutation.mutate(data, {
            onSuccess: () => {
              reset();
              onClose();
            },
          });
        })}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            EchoLog
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Request Board</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-secondary-foreground">Board Name</span>
          <Input
            id="request-board-name"
            placeholder="Feature Requests"
            autoComplete="off"
            maxLength={120}
            aria-describedby={errors.boardName ? 'request-board-name-error' : undefined}
            aria-invalid={errors.boardName ? true : undefined}
            {...register('boardName')}
          />
          {boardName.trim() ? (
            <p className="text-xs text-muted-foreground">Slug: {slugify(boardName)}</p>
          ) : null}
          <CharCounter current={boardName.length} max={120} />
          {errors.boardName ? (
            <p id="request-board-name-error" role="alert" className="text-sm text-destructive">
              {errors.boardName.message}
            </p>
          ) : null}
        </label>

        <input type="hidden" {...register('boardSlug')} />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={createRequestMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 active:bg-primary/80"
            disabled={createRequestMutation.isPending || !isDirty}
          >
            {createRequestMutation.isPending ? 'Requesting...' : 'Request Approval'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
