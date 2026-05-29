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
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            EchoLog
          </p>
          <h2
            id="confirm-dialog-title"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
        </div>

        <p id="confirm-dialog-desc" className="text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        {children}

        {confirmInput ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-secondary-foreground">
              Type{' '}
              <strong className="select-all rounded bg-destructive/10 px-1 py-0.5 font-mono text-destructive">
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
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
            }
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
