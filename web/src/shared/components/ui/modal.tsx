'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { Button } from './button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, children, className, ...props }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !contentRef.current) {
        return;
      }

      const focusable = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus the close button when the modal opens
    const timer = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(timer);

      // Restore focus to the element that triggered the modal
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 animate-fade-in"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        ref={contentRef}
        {...props}
        role="dialog"
        aria-modal="true"
        aria-keyshortcuts="Escape"
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl shadow-black/20 transition-colors animate-scale-in',
          className,
        )}
      >
        <Button
          ref={closeButtonRef}
          type="button"
          variant="ghost"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-3 top-3 size-9 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ×
        </Button>

        {children}
      </div>
    </div>,
    document.body,
  );
}
