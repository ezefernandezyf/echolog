"use client";

import { useState } from 'react';
import { useUiStore } from '../../core/store/ui-store';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Modal } from '../../shared/components/ui/modal';

export function CreateWorkspaceModal() {
  const open = useUiStore((state) => state.activeModal === 'create-workspace');
  const closeModal = useUiStore((state) => state.closeModal);
  const [workspaceName, setWorkspaceName] = useState('');

  return (
    <Modal open={open} onClose={closeModal}>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          closeModal();
        }}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">EchoLog</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Create Workspace</h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Workspace Name</span>
          <Input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Northstar Labs"
            autoComplete="off"
          />
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" className="bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900">
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
