"use client";

import { useState } from 'react';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';
import { cn } from '../../shared/lib/cn';

export function CreatePostModal() {
  const open = useUiStore((state) => state.activeModal === 'create-post');
  const closeModal = useUiStore((state) => state.closeModal);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  return (
    <Modal open={open} onClose={closeModal} className="max-w-2xl">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          closeModal();
        }}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">Screen 4/5</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Submit new feedback</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add dark mode" />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Details</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Tell us what you'd like to improve..."
            rows={6}
            className={cn(
              'flex w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm shadow-black/[0.02] transition-colors placeholder:text-muted-foreground focus-visible:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900">
            Create Post
          </Button>
        </div>
      </form>
    </Modal>
  );
}
