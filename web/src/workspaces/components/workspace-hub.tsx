'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '../../shared/components/ui/button';
import { workspaceApi } from '../../core/api-client';
import { WorkspaceCard, type WorkspaceCardData } from './workspace-card';
import { useUiStore } from '../../core/store/ui-store';
import { CreateWorkspaceModal } from './create-workspace-modal';

interface WorkspaceHubProps {
  onCreateWorkspace?: () => void;
  onSelectWorkspace?: (workspace: WorkspaceCardData) => void;
}

export function WorkspaceHub({ onCreateWorkspace, onSelectWorkspace }: WorkspaceHubProps) {
  const openModal = useUiStore((state) => state.openModal);
  const workspaceQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
    staleTime: 60_000,
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
      <section className="space-y-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">EchoLog</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Your Workspaces</h1>
          </div>

          <Button
            type="button"
            onClick={() => {
              onCreateWorkspace?.();
              openModal('create-workspace');
            }}
          >
            + Create Workspace
          </Button>
        </header>

        {workspaceQuery.isPending ? (
          <div className="flex min-h-[340px] items-center justify-center">
            <p className="text-sm text-zinc-400">Loading workspaces...</p>
          </div>
        ) : workspaceQuery.isError ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-200 bg-red-50/30 px-6 py-16 text-center">
            <p className="text-sm text-red-600">
              {workspaceQuery.error?.message ?? 'Failed to load workspaces'}
            </p>
            <Button type="button" variant="outline" onClick={() => workspaceQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : !Array.isArray(workspaceQuery.data) || workspaceQuery.data.length === 0 ? (
          <div className="flex min-h-[340px] items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center shadow-sm shadow-zinc-900/[0.02]">
            <div className="mx-auto max-w-sm space-y-6">
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-zinc-100 ring-1 ring-inset ring-zinc-200">
                <div className="grid size-8 grid-cols-2 gap-1">
                  <span className="rounded-sm bg-zinc-300" />
                  <span className="rounded-sm bg-zinc-200" />
                  <span className="rounded-sm bg-zinc-200" />
                  <span className="rounded-sm bg-zinc-300" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  No workspaces yet
                </h2>
                <p className="text-sm leading-6 text-zinc-500">
                  Create your first workspace to start organizing boards, posts, and feedback in one
                  clean place.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  onCreateWorkspace?.();
                  openModal('create-workspace');
                }}
              >
                Create your first workspace
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workspaceQuery.data.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onSelect={onSelectWorkspace}
              />
            ))}
          </div>
        )}

        <CreateWorkspaceModal />
      </section>
    </main>
  );
}
