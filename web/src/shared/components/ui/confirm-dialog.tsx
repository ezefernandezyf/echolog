'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmInput?: string;
  variant?: 'danger';
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  confirmInput,
  variant = 'danger',
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  const canConfirm = confirmInput ? typed === confirmInput : true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            EchoLog
          </p>
          <h2
            id="confirm-dialog-title"
            className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100"
          >
            {title}
          </h2>
        </div>

        <p
          id="confirm-dialog-desc"
          className="text-sm leading-6 text-zinc-600 dark:text-zinc-400"
        >
          {message}
        </p>

        {children}

        {confirmInput ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type{' '}
              <strong className="select-all rounded bg-red-100 px-1 py-0.5 font-mono text-red-700 dark:bg-red-950 dark:text-red-400">
                {confirmInput}
              </strong>{' '}
              to confirm
            </span>
            <Input
              placeholder={confirmInput}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </label>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              setTyped('');
            }}
            disabled={!canConfirm || isLoading}
            className={
              variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-500'
                : 'bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:active:bg-zinc-400'
            }
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
