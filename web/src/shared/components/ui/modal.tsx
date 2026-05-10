'use client';

import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { Button } from './button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children, className, ...props }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        {...props}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl shadow-black/20',
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-3 top-3 size-9 rounded-full p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
        >
          ×
        </Button>

        {children}
      </div>
    </div>,
    document.body,
  );
}
