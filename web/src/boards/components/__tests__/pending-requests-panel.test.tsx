import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../../hooks/use-board-requests', () => ({
  usePendingRequests: vi.fn(),
  useUpdateBoardRequest: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { usePendingRequests, useUpdateBoardRequest } from '../../../hooks/use-board-requests';
import { PendingRequestsPanel } from '../pending-requests-panel';

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockRequests = [
  {
    id: 'br-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    userName: 'Alice',
    boardName: 'Feature Requests',
    boardSlug: 'feature-requests',
    status: 'PENDING' as const,
    createdAt: '2026-06-01T12:00:00Z',
  },
  {
    id: 'br-2',
    workspaceId: 'ws-1',
    userId: 'user-2',
    userName: 'Bob',
    boardName: 'Bug Tracker',
    boardSlug: 'bug-tracker',
    status: 'PENDING' as const,
    createdAt: '2026-06-02T08:30:00Z',
  },
];

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
describe('PendingRequestsPanel', () => {
  describe('loading state', () => {
    it('shows loading skeleton while fetching', () => {
      vi.mocked(usePendingRequests).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      expect(screen.getByText('Pending Board Requests')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when request fails', () => {
      vi.mocked(usePendingRequests).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
        error: new Error('Network error'),
      } as any);

      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      expect(screen.getByText('Pending Board Requests')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows "No pending board requests" when list is empty', () => {
      vi.mocked(usePendingRequests).mockReturnValue({
        data: [],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      expect(screen.getByText('No pending board requests')).toBeInTheDocument();
    });
  });

  describe('pending requests list', () => {
    it('renders pending requests with board names and requester info', () => {
      vi.mocked(usePendingRequests).mockReturnValue({
        data: mockRequests,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      expect(screen.getByText('Feature Requests')).toBeInTheDocument();
      expect(screen.getByText('Bug Tracker')).toBeInTheDocument();
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });
  });

  describe('approve/reject actions', () => {
    it('calls update mutation with APPROVED when Approve button is clicked', async () => {
      const updateMutate = vi.fn();
      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: updateMutate,
        isPending: false,
      } as any);

      vi.mocked(usePendingRequests).mockReturnValue({
        data: mockRequests,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      const user = userEvent.setup();
      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      const approveButtons = screen.getAllByText('Approve');
      await user.click(approveButtons[0]);

      expect(updateMutate).toHaveBeenCalledWith(
        { requestId: 'br-1', data: { status: 'APPROVED' } },
        expect.any(Object),
      );
    });

    it('calls update mutation with REJECTED when Reject button is clicked', async () => {
      const updateMutate = vi.fn();
      vi.mocked(useUpdateBoardRequest).mockReturnValue({
        mutate: updateMutate,
        isPending: false,
      } as any);

      vi.mocked(usePendingRequests).mockReturnValue({
        data: mockRequests,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      const user = userEvent.setup();
      render(<PendingRequestsPanel workspaceId="ws-1" />, { wrapper: TestWrapper });

      const rejectButtons = screen.getAllByText('Reject');
      await user.click(rejectButtons[0]);

      expect(updateMutate).toHaveBeenCalledWith(
        { requestId: 'br-1', data: { status: 'REJECTED' } },
        expect.any(Object),
      );
    });
  });
});
