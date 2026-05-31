import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/invitations', () => ({
  invitationsApi: { cancel: vi.fn(), listPending: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { invitationsApi } from '../../api/invitations';
import { PendingInvitationsList } from '../components/pending-invitations-list';
import type { InvitationDTO } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockInvitations: InvitationDTO[] = [
  {
    id: 'inv-1',
    workspaceId: 'ws-1',
    workspaceName: 'Test Workspace',
    invitedEmail: 'alice@test.com',
    role: 'ADMIN',
    status: 'PENDING',
    token: 'token-1',
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    workspaceId: 'ws-1',
    workspaceName: 'Test Workspace',
    invitedEmail: 'bob@test.com',
    role: 'MEMBER',
    status: 'PENDING',
    token: 'token-2',
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

// ---------------------------------------------------------------------------
// Setup
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
describe('PendingInvitationsList', () => {
  // ── Empty state ───────────────────────────────────────────────────────
  it('shows "no pending invitations" message when list is empty', () => {
    render(<PendingInvitationsList workspaceId="ws-1" invitations={[]} isLoading={false} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByText('No pending invitations.')).toBeInTheDocument();
  });

  // ── Loading state ─────────────────────────────────────────────────────
  it('shows skeleton placeholders while loading', () => {
    render(<PendingInvitationsList workspaceId="ws-1" invitations={[]} isLoading={true} />, {
      wrapper: TestWrapper,
    });

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(2);
    expect(screen.queryByText('No pending invitations.')).not.toBeInTheDocument();
  });

  // ── Success: renders invitation list ──────────────────────────────────
  it('renders invitation list with emails and cancel buttons', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.cancel).mockResolvedValue(undefined);

    render(
      <PendingInvitationsList workspaceId="ws-1" invitations={mockInvitations} isLoading={false} />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();

    // Role and status should be displayed
    expect(screen.getByText(/Role: Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Role: Member/)).toBeInTheDocument();
    expect(screen.getAllByText(/Status: Pending/)).toHaveLength(2);

    // Cancel buttons should be present for pending invitations
    const cancelButtons = screen.getAllByText('Cancel');
    expect(cancelButtons).toHaveLength(2);

    // Click cancel on first invitation
    await user.click(cancelButtons[0]);

    expect(invitationsApi.cancel).toHaveBeenCalledWith('ws-1', 'inv-1');
  });

  // ── No cancel button for non-pending invitations ──────────────────────
  it('does not show cancel button for non-pending invitations', () => {
    const acceptedInvitation: InvitationDTO = {
      ...mockInvitations[0],
      status: 'ACCEPTED',
    };

    render(
      <PendingInvitationsList
        workspaceId="ws-1"
        invitations={[acceptedInvitation]}
        isLoading={false}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});
