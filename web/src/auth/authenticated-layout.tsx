'use client';

import { createContext, useContext, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useUiStore } from '../core/store/ui-store';
import { SidebarContainer } from './sidebar-container';
import { MobileHeader } from './mobile-header';
import { CreateBoardModal } from '../boards/components/create-board-modal';
import { CreatePostModal } from '../boards/components/create-post-modal';

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
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const openSidebar = useUiStore((state) => state.openSidebar);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

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

        <SidebarContainer
          sidebarOpen={sidebarOpen}
          onClose={closeSidebar}
          selectedBoardId={selectedBoardId}
          onSelectBoard={setSelectedBoardId}
        />

        <div className="flex min-h-screen flex-1 flex-col animate-fade-in overflow-x-hidden">
          <MobileHeader onToggleSidebar={openSidebar} />
          <Outlet />
        </div>

        {workspaceId ? <CreateBoardModal workspaceId={workspaceId} /> : null}
        {selectedBoardId ? <CreatePostModal boardId={selectedBoardId} /> : null}
      </div>
    </AuthenticatedShellContext.Provider>
  );
}
