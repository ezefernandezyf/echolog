'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar, type SidebarItem } from '../boards/components/sidebar';
import { useUiStore } from '../core/store/ui-store';
import { boardApi, workspaceApi } from '../core/api-client';
import { useAuthStore } from './auth-store';
import { CreateBoardModal } from '../boards/components/create-board-modal';
import { CreatePostModal } from '../boards/components/create-post-modal';
import { cn } from '../shared/lib/cn';
import { Button } from '../shared/components/ui/button';
import { ErrorAlert } from '../shared/components/ui/error-alert';

type AuthenticatedShellContextValue = {
  selectedBoardId: string | null;
  setSelectedBoardId: (boardId: string | null) => void;
};

const AuthenticatedShellContext = createContext<AuthenticatedShellContextValue | null>(null);

export function useAuthenticatedShell() {
  const context = useContext(AuthenticatedShellContext);

  if (!context) {
    throw new Error('useAuthenticatedShell must be used within AuthenticatedLayout');
  }

  return context;
}

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const openSidebar = useUiStore((state) => state.openSidebar);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const openModal = useUiStore((state) => state.openModal);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const previousWorkspaceIdRef = useRef<string | undefined>(undefined);
  const userId = useAuthStore((state) => state.session?.user?.id);

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: workspaceApi.list,
    staleTime: 60_000,
    enabled: !!userId,
  });

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });

  const workspaceName = workspaceId
    ? (workspacesQuery.data?.find((workspace) => workspace.id === workspaceId)?.name ?? workspaceId)
    : 'Workspaces';

  useEffect(() => {
    if (!workspaceId) {
      setSelectedBoardId(null);
      return;
    }

    const firstBoardId = boardsQuery.data?.[0]?.id ?? null;
    setSelectedBoardId((current) => current ?? firstBoardId);
  }, [boardsQuery.data, workspaceId]);

  useEffect(() => {
    if (previousWorkspaceIdRef.current !== workspaceId) {
      previousWorkspaceIdRef.current = workspaceId;
      setSelectedBoardId(null);
    }
  }, [workspaceId]);

  const sidebarItems: SidebarItem[] = workspaceId
    ? (boardsQuery.data ?? []).map((board) => ({ id: board.id, label: board.name }))
    : (workspacesQuery.data ?? []).map((workspace) => ({
        id: workspace.id,
        label: workspace.name,
      }));

  const activeItemId = workspaceId ? (selectedBoardId ?? '') : (workspaceId ?? '');

  return (
    <AuthenticatedShellContext.Provider
      value={{
        selectedBoardId,
        setSelectedBoardId,
      }}
    >
      <div className="flex min-h-screen overflow-x-hidden bg-secondary text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to main content
        </a>

        {boardsQuery.isPending && workspaceId ? (
          <aside
            className={cn(
              'flex w-72 flex-col border-r border-border bg-secondary',
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
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

        {!workspaceId && workspacesQuery.isError ? (
          <aside
            className={cn(
              'flex flex-col items-center justify-center gap-3 border-r border-border p-5',
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
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

        {workspaceId && boardsQuery.isError ? (
          <aside
            className={cn(
              'flex flex-col items-center justify-center gap-3 border-r border-border p-5',
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <p className="text-sm text-destructive">Failed to load boards</p>
            <Button type="button" onClick={() => boardsQuery.refetch()}>
              Retry
            </Button>
          </aside>
        ) : (
          <Sidebar
            workspaceName={workspaceName}
            workspaceId={workspaceId ?? ''}
            items={sidebarItems}
            activeItemId={activeItemId}
            onCreateBoard={workspaceId ? () => openModal('create-board') : undefined}
            onSelectBoard={(itemId) => {
              if (workspaceId) {
                setSelectedBoardId(itemId);
                if (location.pathname !== `/w/${workspaceId}`) {
                  navigate(`/w/${workspaceId}`);
                }
              } else {
                navigate(`/w/${itemId}`);
              }

              closeSidebar();
            }}
            onNavClick={closeSidebar}
            className={cn(
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          />
        )}

        {sidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col animate-fade-in overflow-x-hidden">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
            <button
              type="button"
              id="mobile-hamburger"
              onClick={openSidebar}
              aria-label="Open sidebar"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary shadow-sm transition-colors hover:bg-muted"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-secondary-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <Link to="/w" className="font-semibold tracking-tight text-foreground">
              EchoLog
            </Link>
          </header>

          <Outlet />
        </div>

        {workspaceId ? <CreateBoardModal workspaceId={workspaceId} /> : null}
        {selectedBoardId ? <CreatePostModal boardId={selectedBoardId} /> : null}
      </div>
    </AuthenticatedShellContext.Provider>
  );
}
