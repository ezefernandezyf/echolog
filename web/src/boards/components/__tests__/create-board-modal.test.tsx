import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../../hooks/use-workspaces', () => ({
  useWorkspaces: vi.fn(),
}));

vi.mock('../../../hooks/use-boards', () => ({
  useCreateBoard: vi.fn(),
}));

vi.mock('../../../hooks/use-board-requests', () => ({
  useCreateBoardRequest: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateBoardRequest: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  usePendingRequests: vi.fn(() => ({ data: [], isPending: false, isError: false, error: null })),
}));

vi.mock('../../../core/store/ui-store', () => ({
  useUiStore: vi.fn((selector?: (s: any) => unknown) => {
    const store = {
      activeModal: 'create-board' as const,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    };
    return selector ? selector(store) : store;
  }),
}));

vi.mock('../../../auth/auth-store', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => unknown) => {
    const state = {
      session: { user: { id: 'user-1', email: 'test@test.dev', name: 'Test', emailVerified: false } },
      status: 'authenticated' as const,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { useWorkspaces } from '../../../hooks/use-workspaces';
import { useCreateBoard } from '../../../hooks/use-boards';
import { CreateBoardModal } from '../create-board-modal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockMutation = () => ({
  mutate: vi.fn(),
  isPending: false,
} as any);

function mockWorkspaceData(overrides?: Record<string, unknown>) {
  return {
    id: 'ws-1',
    name: 'Test WS',
    slug: 'test-ws',
    role: 'MEMBER',
    visibility: 'PRIVATE',
    publicAccessLevel: 'READ_ONLY',
    adminsCanEditSettings: true,
    boardCreation: 'MEMBERS',
    boardDeletion: 'ADMINS',
    commenting: 'MEMBERS',
    boardCreationPolicy: 'FREE',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CreateBoardModal — policy-aware', () => {
  describe('FREE policy', () => {
    it('shows normal create board form for member', async () => {
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [mockWorkspaceData({ boardCreationPolicy: 'FREE' })],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useCreateBoard).mockReturnValue(mockMutation());

      render(<CreateBoardModal workspaceId="ws-1" />, { wrapper: TestWrapper });

      await waitFor(() => {
        const elements = screen.getAllByText('Create Board');
        // H2 heading + submit button = at least 2 occurrences
        expect(elements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('APPROVAL_REQUIRED policy', () => {
    it('shows request board UI for non-admin member', async () => {
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [mockWorkspaceData({ boardCreationPolicy: 'APPROVAL_REQUIRED', role: 'MEMBER' })],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useCreateBoard).mockReturnValue(mockMutation());

      render(<CreateBoardModal workspaceId="ws-1" />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Request Board')).toBeInTheDocument();
        expect(
          screen.getByText(/Board creation requires admin approval/),
        ).toBeInTheDocument();
        expect(screen.getByText('Request Approval')).toBeInTheDocument();
      });
    });

    it('shows normal create board form for admin/owner under APPROVAL_REQUIRED', async () => {
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [mockWorkspaceData({ boardCreationPolicy: 'APPROVAL_REQUIRED', role: 'ADMIN' })],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useCreateBoard).mockReturnValue(mockMutation());

      render(<CreateBoardModal workspaceId="ws-1" />, { wrapper: TestWrapper });

      await waitFor(() => {
        const elements = screen.getAllByText('Create Board');
        expect(elements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('ADMINS_ONLY policy', () => {
    it('does not render modal for non-admin member', () => {
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [mockWorkspaceData({ boardCreationPolicy: 'ADMINS_ONLY', role: 'MEMBER' })],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useCreateBoard).mockReturnValue(mockMutation());

      render(<CreateBoardModal workspaceId="ws-1" />, { wrapper: TestWrapper });

      // Modal content should not be visible
      expect(screen.queryByText('Create Board')).not.toBeInTheDocument();
    });

    it('shows normal create board form for admin under ADMINS_ONLY', async () => {
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [mockWorkspaceData({ boardCreationPolicy: 'ADMINS_ONLY', role: 'ADMIN' })],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useCreateBoard).mockReturnValue(mockMutation());

      render(<CreateBoardModal workspaceId="ws-1" />, { wrapper: TestWrapper });

      await waitFor(() => {
        const elements = screen.getAllByText('Create Board');
        expect(elements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
