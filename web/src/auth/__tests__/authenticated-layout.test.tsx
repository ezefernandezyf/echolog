import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthenticatedLayout } from '../authenticated-layout';
import { useAuthStore } from '../auth-store';
import { useUiStore } from '../../core/store/ui-store';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------
// Mock hooks so we control loading / data / error states without React Query
// Also include mutation hooks because CreateBoardModal / CreatePostModal
// (rendered by AuthenticatedLayout) import them from the same modules.
vi.mock('../../hooks/use-workspaces', () => ({
  useWorkspaces: vi.fn(),
  useCreateWorkspace: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateWorkspace: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteWorkspace: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('../../hooks/use-boards', () => ({
  useBoards: vi.fn(),
  useCreateBoard: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateBoard: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteBoard: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

// Mock Sidebar to avoid deep-dependency issues (useLogout,
// PendingInvitationsBell, ConfirmDialog, etc.)
vi.mock('../../boards/components/sidebar', () => ({
  Sidebar: vi.fn(({ items, activeItemId }) => (
    <div data-testid="sidebar-mock">
      {items.map((item: { id: string; label: string }) => (
        <span key={item.id} data-testid="sidebar-item">
          {item.label}
        </span>
      ))}
      <span data-testid="sidebar-active">{activeItemId}</span>
    </div>
  )),
}));

vi.mock('../../hooks/use-posts', () => ({
  usePosts: vi.fn(),
  useCreatePost: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdatePostStatus: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks (hoisted)
// ---------------------------------------------------------------------------
import { useWorkspaces } from '../../hooks/use-workspaces';
import { useBoards } from '../../hooks/use-boards';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const sampleUser = { id: 'user-1', email: 'alice@echolog.dev', name: 'Alice' };

const sampleWorkspaces = [
  { id: 'ws-1', name: 'Workspace 1', slug: 'ws-1', role: 'OWNER' as const, visibility: 'PRIVATE' as const, publicAccessLevel: 'READ_ONLY' as const },
  { id: 'ws-2', name: 'Workspace 2', slug: 'ws-2', role: 'MEMBER' as const },
];

const sampleBoards = [
  {
    id: 'board-1',
    workspaceId: 'ws-1',
    name: 'Board 1',
    slug: 'board-1',
    description: null,
  },
  {
    id: 'board-2',
    workspaceId: 'ws-1',
    name: 'Board 2',
    slug: 'board-2',
    description: null,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface RenderLayoutOptions {
  route?: string;
}

/** Render the AuthenticatedLayout with child routes inside providers. */
function renderLayout({ route = '/w' }: RenderLayoutOptions = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/w" element={<p data-testid="outlet-content">Workspace Hub</p>} />
            <Route
              path="/w/:workspaceId"
              element={<p data-testid="outlet-content">Board Layout</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  useAuthStore.setState({
    session: { user: sampleUser },
    status: 'authenticated',
  });
  useUiStore.setState({ sidebarOpen: true, theme: 'light' });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// R5: Authenticated Layout Composition — rendering
// ===========================================================================

describe('R5 — AuthenticatedLayout composition', () => {
  it('renders SidebarContainer (via sidebar-mock), MobileHeader, and Outlet', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout();

    // Sidebar mock is rendered (proxies SidebarContainer → Sidebar)
    expect(await screen.findByTestId('sidebar-mock')).toBeInTheDocument();

    // MobileHeader hamburger button
    expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();

    // MobileHeader brand link
    expect(screen.getByText('EchoLog')).toBeInTheDocument();

    // Outlet content renders the child route
    expect(screen.getByTestId('outlet-content')).toHaveTextContent('Workspace Hub');
  });

  it('renders board layout child route when workspaceId is present', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: sampleBoards,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout({ route: '/w/ws-1' });

    expect(await screen.findByTestId('outlet-content')).toHaveTextContent('Board Layout');
  });
});

// ===========================================================================
// R6: Sidebar Data Fetching — loading state
// ===========================================================================

describe('R6 — SidebarContainer data fetching', () => {
  it('shows loading skeleton while boards are fetching', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    // Boards are still loading
    vi.mocked(useBoards).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { container } = renderLayout({ route: '/w/ws-1' });

    // Loading skeleton renders animate-pulse elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Sidebar should NOT render while loading
    expect(screen.queryByTestId('sidebar-mock')).not.toBeInTheDocument();
  });

  it('shows workspaces and boards when data loads', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: sampleBoards,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout({ route: '/w/ws-1' });

    // Sidebar renders with board items
    expect(await screen.findByTestId('sidebar-mock')).toBeInTheDocument();

    const items = screen.getAllByTestId('sidebar-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Board 1');
    expect(items[1]).toHaveTextContent('Board 2');

    // First board should be auto-selected
    expect(screen.getByTestId('sidebar-active')).toHaveTextContent('board-1');
  });
});

// ===========================================================================
// TopNavbar (renamed from MobileHeader)
// ===========================================================================

describe('TopNavbar', () => {
  it('renders hamburger button with correct accessibility attributes', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout();

    const hamburger = await screen.findByLabelText('Open sidebar');
    expect(hamburger).toBeInTheDocument();
    expect(hamburger.tagName).toBe('BUTTON');
    expect(hamburger).toHaveAttribute('id', 'mobile-hamburger');
  });

  it('has theme toggle present in TopNavbar', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout();

    // Theme toggle renders with "Switch to dark mode" since theme is 'light'
    expect(await screen.findByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('renders Settings and Log out links in the navbar', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: sampleWorkspaces,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useBoards).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderLayout();

    // Settings link should exist in the navbar
    const settingsLink = await screen.findByText('Settings');
    expect(settingsLink).toBeInTheDocument();

    // Log out link/button should exist
    const logoutBtn = screen.getByText('Log out');
    expect(logoutBtn).toBeInTheDocument();
  });
});
