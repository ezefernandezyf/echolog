import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock the API client — vi.mock is hoisted, so use vi.fn() inside the factory
// ---------------------------------------------------------------------------
vi.mock('../../api/workspaces', () => ({
  workspaceApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

vi.mock('../../api/boards', () => ({
  boardApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../api/posts', () => ({
  postApi: { list: vi.fn(), create: vi.fn(), updateStatus: vi.fn(), getById: vi.fn() },
}));

vi.mock('../../api/votes', () => ({
  voteApi: { addVote: vi.fn(), removeVote: vi.fn() },
}));

vi.mock('../../api/comments', () => ({
  commentApi: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Import the mocked modules
import { workspaceApi } from '../../api/workspaces';
import { WorkspaceHub } from '../components/workspace-hub';
import { useUiStore } from '../../core/store/ui-store';
import { useAuthStore } from '../../auth/auth-store';
import type { WorkspaceCardData } from '../components/workspace-card';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockWorkspaces: WorkspaceCardData[] = [
  {
    id: 'ws-1',
    name: 'Northstar Labs',
    slug: 'northstar-labs',
    role: 'OWNER',
    activeBoardsCount: 3,
    visibility: 'PRIVATE',
    publicAccessLevel: 'READ_ONLY',
  } as unknown as WorkspaceCardData,
  {
    id: 'ws-2',
    name: 'Growth Team',
    slug: 'growth-team',
    role: 'MEMBER',
    activeBoardsCount: 1,
    visibility: 'PRIVATE',
    publicAccessLevel: 'READ_ONLY',
  } as unknown as WorkspaceCardData,
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

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Reset stores and DOM before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  useUiStore.setState({ sidebarOpen: true, activeModal: null, notification: null });
  useAuthStore.setState({
    session: { user: { id: 'test-user-id', email: 'test@test.com', name: 'Test User' } },
    status: 'authenticated' as const,
  });
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// Tests
// ===========================================================================
describe('WorkspaceHub', () => {
  // -----------------------------------------------------------------------
  // 1. Renders workspace list
  // -----------------------------------------------------------------------
  it('renders the list of workspaces when data is returned', async () => {
    vi.mocked(workspaceApi.list).mockResolvedValue(mockWorkspaces as any);

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    // Loading state appears first — skeletons shown, no workspace names yet
    expect(screen.queryByText('Northstar Labs')).not.toBeInTheDocument();

    // After data loads, workspace cards appear
    await waitFor(() => {
      expect(screen.getByText('Northstar Labs')).toBeInTheDocument();
    });

    expect(screen.getByText('Growth Team')).toBeInTheDocument();

    // Captions should be visible
    expect(screen.getByText('3 active boards')).toBeInTheDocument();
    expect(screen.getByText('1 active board')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. Clicking a workspace navigates to its boards
  // -----------------------------------------------------------------------
  it('navigates to workspace boards when a card is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceApi.list).mockResolvedValue(mockWorkspaces as any);

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Northstar Labs')).toBeInTheDocument();
    });

    const card = screen.getByRole('button', { name: /Northstar Labs/ });
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/w/ws-1');
  });

  // -----------------------------------------------------------------------
  // 3. Calls onSelectWorkspace callback
  // -----------------------------------------------------------------------
  it('calls onSelectWorkspace when a workspace card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.mocked(workspaceApi.list).mockResolvedValue(mockWorkspaces as any);

    render(<WorkspaceHub onSelectWorkspace={onSelect} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Northstar Labs')).toBeInTheDocument();
    });

    const card = screen.getByRole('button', { name: /Northstar Labs/ });
    await user.click(card);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ws-1', name: 'Northstar Labs' }),
    );
  });

  // -----------------------------------------------------------------------
  // 4. Empty state
  // -----------------------------------------------------------------------
  it('shows empty state when no workspaces exist', async () => {
    vi.mocked(workspaceApi.list).mockResolvedValue([]);

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('No workspaces yet')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Create your first workspace to start organizing boards, posts, and feedback/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText('Create your first workspace')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 5. Error state
  // -----------------------------------------------------------------------
  it('shows error state and retry button when loading fails', async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceApi.list).mockRejectedValue(new Error('Network failure'));

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    // Reset mock for retry
    vi.mocked(workspaceApi.list).mockResolvedValue(mockWorkspaces as any);

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Northstar Labs')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // 6. Create workspace modal opens
  // -----------------------------------------------------------------------
  it('opens the create workspace modal when the button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceApi.list).mockResolvedValue([]);

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('No workspaces yet')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create your first workspace');
    await user.click(createButton);

    // The modal should now be open (rendered via portal into document.body)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
    expect(useUiStore.getState().activeModal).toBe('create-workspace');
  });

  // -----------------------------------------------------------------------
  // 7. Create workspace modal closes via Cancel
  // -----------------------------------------------------------------------
  it('closes the create workspace modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(workspaceApi.list).mockResolvedValue([]);
    useUiStore.setState({ activeModal: 'create-workspace' });

    render(<WorkspaceHub />, { wrapper: TestWrapper });

    // Modal should already be open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(useUiStore.getState().activeModal).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 8. onCreateWorkspace callback
  // -----------------------------------------------------------------------
  it('calls onCreateWorkspace when the create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    vi.mocked(workspaceApi.list).mockResolvedValue(mockWorkspaces as any);

    render(<WorkspaceHub onCreateWorkspace={onCreate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      // Use getAllByText since there are two cards with the same name
      const cards = screen.getAllByText('Northstar Labs');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    const createButton = screen.getByRole('button', { name: '+ Create Workspace' });
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
