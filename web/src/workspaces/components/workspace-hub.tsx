'use client';

import { Button } from '../../shared/components/ui/button';
import { useWorkspaces } from '../../hooks/use-workspaces';
import { useAuthStore } from '../../auth/auth-store';
import { WorkspaceCard, type WorkspaceCardData } from './workspace-card';
import { useUiStore } from '../../core/store/ui-store';
import { CreateWorkspaceModal } from './create-workspace-modal';
import { WorkspaceSkeletonGrid } from '../../shared/components/domain-skeletons';
import { useFocusOnMount } from '../../shared/hooks/use-focus-on-mount';
import { PageTitle } from '../../core/page-title';

interface WorkspaceHubProps {
  onCreateWorkspace?: () => void;
  onSelectWorkspace?: (workspace: WorkspaceCardData) => void;
}

export function WorkspaceHub({ onCreateWorkspace, onSelectWorkspace }: WorkspaceHubProps) {
  const openModal = useUiStore((state) => state.openModal);
  const userId = useAuthStore((state) => state.session?.user?.id);

  const workspaceQuery = useWorkspaces(userId);

  useFocusOnMount('h1');

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-10 animate-fade-in"
    >
      <PageTitle title="Workspaces" />
      <section className="space-y-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              EchoLog
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Your Workspaces
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                onCreateWorkspace?.();
                openModal('create-workspace');
              }}
            >
              + Create Workspace
            </Button>
          </div>
        </header>

        {workspaceQuery.isPending ? (
          <WorkspaceSkeletonGrid />
        ) : workspaceQuery.isError ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-destructive/20 bg-destructive/10 px-6 py-16 text-center">
            <p className="text-sm text-destructive">
              {workspaceQuery.error?.message ?? 'Failed to load workspaces'}
            </p>
            <Button type="button" variant="outline" onClick={() => workspaceQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : !Array.isArray(workspaceQuery.data) || workspaceQuery.data.length === 0 ? (
          <div className="flex min-h-[340px] items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm shadow-black/[0.02]">
            <div className="mx-auto max-w-sm space-y-6">
              <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted ring-1 ring-inset ring-border">
                <div className="grid size-8 grid-cols-2 gap-1">
                  <span className="rounded-sm bg-muted" />
                  <span className="rounded-sm bg-muted" />
                  <span className="rounded-sm bg-muted" />
                  <span className="rounded-sm bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  No workspaces yet
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
