import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../../hooks/use-board-requests', () => ({
  useCreateBoardRequest: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { useCreateBoardRequest } from '../../../hooks/use-board-requests';
import { BoardRequestForm } from '../board-request-form';

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
describe('BoardRequestForm', () => {
  it('renders the form with board name input', () => {
    vi.mocked(useCreateBoardRequest).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <BoardRequestForm workspaceId="ws-1" open={true} onClose={vi.fn()} />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByLabelText('Board Name')).toBeInTheDocument();
    expect(screen.getByText('Request Approval')).toBeInTheDocument();
  });

  it('auto-generates slug from board name', async () => {
    vi.mocked(useCreateBoardRequest).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const user = userEvent.setup();
    render(
      <BoardRequestForm workspaceId="ws-1" open={true} onClose={vi.fn()} />,
      { wrapper: TestWrapper },
    );

    const nameInput = screen.getByLabelText('Board Name');
    await user.type(nameInput, 'Feature Requests');

    await waitFor(() => {
      expect(screen.getByText('Slug: feature-requests')).toBeInTheDocument();
    });
  });

  it('calls createBoardRequest mutation with form data on submit', async () => {
    const createMutate = vi.fn(
      (_data: unknown, callbacks?: { onSuccess?: () => void }) => {
        callbacks?.onSuccess?.();
      },
    );

    vi.mocked(useCreateBoardRequest).mockReturnValue({
      mutate: createMutate,
      isPending: false,
    } as any);

    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <BoardRequestForm workspaceId="ws-1" open={true} onClose={onClose} />,
      { wrapper: TestWrapper },
    );

    // Type board name
    const nameInput = screen.getByLabelText('Board Name');
    await user.type(nameInput, 'My New Board');

    // Wait for auto-slug generation
    await waitFor(() => {
      expect(screen.getByText('Slug: my-new-board')).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByText('Request Approval');
    await user.click(submitButton);

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith(
        { boardName: 'My New Board', boardSlug: 'my-new-board' },
        expect.any(Object),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('cancel button calls onClose', async () => {
    vi.mocked(useCreateBoardRequest).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <BoardRequestForm workspaceId="ws-1" open={true} onClose={onClose} />,
      { wrapper: TestWrapper },
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
