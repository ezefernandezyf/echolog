'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar, type SidebarItem } from '../boards/components/sidebar';
import { useUiStore } from '../core/store/ui-store';
import { boardApi, workspaceApi } from '../core/api-client';
import { CreateBoardModal } from '../boards/components/create-board-modal';
import { cn } from '../shared/lib/cn';
import { Button } from '../shared/components/ui/button';

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

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.list,
    staleTime: 60_000,
  });

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => boardApi.list(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });

  const workspaceName =
    workspaceId
      ? workspacesQuery.data?.find((workspace) => workspace.id === workspaceId)?.name ?? workspaceId
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
    : (workspacesQuery.data ?? []).map((workspace) => ({ id: workspace.id, label: workspace.name }));

  const activeItemId = workspaceId ? selectedBoardId ?? '' : workspaceId ?? '';

  return (
    <AuthenticatedShellContext.Provider
      value={{
        selectedBoardId,
        setSelectedBoardId,
      }}
    >
      <div className="flex min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-background dark:text-foreground">
        {boardsQuery.isPending && workspaceId ? (
          <aside
            className={cn(
              'flex w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-background',
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
              <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-card">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
                    Workspace
                  </p>
                  <div className="h-5 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 py-4">
              <div className="space-y-2">
                <div className="h-10 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-10 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-10 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </aside>
        ) : null}

        {workspaceId && boardsQuery.isError ? (
          <aside
            className={cn(
              'flex flex-col items-center justify-center gap-3 border-r border-zinc-200 p-5 dark:border-zinc-800 dark:bg-red-950/20',
              'lg:relative lg:w-72 lg:translate-x-0 lg:z-auto',
              'fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load boards</p>
            <Button
              type="button"
              onClick={() => boardsQuery.refetch()}
            >
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
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden dark:border-zinc-800 dark:bg-card">
            <button
              type="button"
              onClick={openSidebar}
              aria-label="Open sidebar"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-zinc-700 dark:text-zinc-300"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">EchoLog</span>
          </header>

          <Outlet />
        </div>

        {workspaceId ? <CreateBoardModal workspaceId={workspaceId} /> : null}
      </div>
    </AuthenticatedShellContext.Provider>
  );
}
