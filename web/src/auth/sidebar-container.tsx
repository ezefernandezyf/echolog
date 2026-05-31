'use client';

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Sidebar, type SidebarItem } from '../boards/components/sidebar';
import { useBoards } from '../hooks/use-boards';
import { useWorkspaces } from '../hooks/use-workspaces';
import { useAuthStore } from './auth-store';
import { useUiStore } from '../core/store/ui-store';
import { cn } from '../shared/lib/cn';
import { Button } from '../shared/components/ui/button';
import { ErrorAlert } from '../shared/components/ui/error-alert';

interface SidebarContainerProps {
  sidebarOpen: boolean;
  onClose: () => void;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
}

const sidebarPositionClasses =
  'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto ' +
  'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out';

export function SidebarContainer({
  sidebarOpen,
  onClose,
  selectedBoardId,
  onSelectBoard,
}: SidebarContainerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const previousWorkspaceIdRef = useRef<string | undefined>(undefined);
  const userId = useAuthStore((state) => state.session?.user?.id);
  const openModal = useUiStore((state) => state.openModal);

  const workspacesQuery = useWorkspaces(userId);
  const boardsQuery = useBoards(workspaceId);

  const workspaceName = workspaceId
    ? (workspacesQuery.data?.find((w) => w.id === workspaceId)?.name ?? workspaceId)
    : 'Workspaces';

  // Reset board selection when workspace changes
  useEffect(() => {
    if (previousWorkspaceIdRef.current !== workspaceId) {
      previousWorkspaceIdRef.current = workspaceId;
      onSelectBoard(null);
    }
  }, [workspaceId, onSelectBoard]);

  // Auto-select first board when boards load and none selected
  useEffect(() => {
    if (!workspaceId) {
      onSelectBoard(null);
      return;
    }
    const firstBoardId = boardsQuery.data?.[0]?.id ?? null;
    if (!selectedBoardId && firstBoardId) {
      onSelectBoard(firstBoardId);
    }
  }, [boardsQuery.data, workspaceId, selectedBoardId, onSelectBoard]);

  const sidebarItems: SidebarItem[] = workspaceId
    ? (boardsQuery.data ?? []).map((board) => ({ id: board.id, label: board.name }))
    : (workspacesQuery.data ?? []).map((workspace) => ({
        id: workspace.id,
        label: workspace.name,
      }));

  const activeItemId = workspaceId ? (selectedBoardId ?? '') : (workspaceId ?? '');

  const handleSelect = (itemId: string) => {
    if (workspaceId) {
      onSelectBoard(itemId);
      if (location.pathname !== `/w/${workspaceId}`) {
        navigate(`/w/${workspaceId}`);
      }
    } else {
      navigate(`/w/${itemId}`);
    }
    onClose();
  };

  const translateClass = sidebarOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Loading state: boards loading within a workspace */}
      {boardsQuery.isPending && workspaceId ? (
        <aside
          className={cn(
            'flex w-72 flex-col border-r border-border bg-secondary',
            sidebarPositionClasses,
            translateClass,
          )}
        >
          <div className="border-b border-border px-5 py-5">
            <div className="flex w-full items-center rounded-2xl border border-border bg-card px-4 py-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Workspace
                </p>
                <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="space-y-2">
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </aside>
      ) : null}

      {/* Error state: outside a workspace and workspaces failed to load */}
      {!workspaceId && workspacesQuery.isError ? (
        <aside
          className={cn(
            'flex flex-col items-center justify-center gap-3 border-r border-border p-5',
            sidebarPositionClasses,
            translateClass,
          )}
        >
          <ErrorAlert
            message="Failed to load workspaces"
            onRetry={() => workspacesQuery.refetch()}
            retryLabel="Retry"
            className="rounded-2xl w-full"
          />
        </aside>
      ) : null}

      {/* Error state: inside a workspace and boards failed to load */}
      {workspaceId && boardsQuery.isError ? (
        <aside
          className={cn(
            'flex flex-col items-center justify-center gap-3 border-r border-border p-5',
            sidebarPositionClasses,
            translateClass,
          )}
        >
          <p className="text-sm text-destructive">Failed to load boards</p>
          <Button type="button" onClick={() => boardsQuery.refetch()}>
            Retry
          </Button>
        </aside>
      ) : null}

      {/* Normal state: Sidebar with workspace or board items */}
      {/* Only block on boards query state when inside a workspace */}
      {!workspacesQuery.isError &&
      (!workspaceId || (!boardsQuery.isPending && !boardsQuery.isError)) ? (
        <Sidebar
          workspaceName={workspaceName}
          workspaceId={workspaceId ?? ''}
          items={sidebarItems}
          activeItemId={activeItemId}
          onCreateBoard={workspaceId ? () => openModal('create-board') : undefined}
          onSelectBoard={handleSelect}
          onNavClick={onClose}
          className={cn(sidebarPositionClasses, translateClass)}
        />
      ) : null}

      {/* Mobile overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}
