import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/invitations', () => ({
  invitationsApi: {
    getByToken: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
    create: vi.fn(),
    listPending: vi.fn(),
    listMine: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { invitationsApi } from '../../api/invitations';
import { AcceptInvitationPage } from '../components/accept-invitation-page';
import { useAuthStore } from '../../auth/auth-store';
import type { InvitationDTO } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockInvitation: InvitationDTO = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  workspaceName: 'Northstar Labs',
  invitedEmail: 'alice@test.com',
  role: 'ADMIN',
  status: 'PENDING',
  token: 'valid-token',
  expiresAt: '2025-01-01T00:00:00.000Z',
};

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
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/invite/valid-token']}>
        <Routes>
          <Route path="/invite/:token" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AcceptInvitationPage', () => {
  // ── Loading state ─────────────────────────────────────────────────────
  it('shows loading skeleton while fetching invitation', async () => {
    // Never resolves
    vi.mocked(invitationsApi.getByToken).mockReturnValue(new Promise(() => {}));

    render(<AcceptInvitationPage />, { wrapper: TestWrapper });

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── Error: invalid/expired invitation ────────────────────────────────
  it('shows error message when invitation is not found', async () => {
    vi.mocked(invitationsApi.getByToken).mockRejectedValue(new Error('Invitation not found'));

    render(<AcceptInvitationPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Invitation Unavailable')).toBeInTheDocument();
    });

    expect(screen.getByText('Invitation not found')).toBeInTheDocument();
  });

  // ── Not authenticated: shows sign in / create account ────────────────
  it('shows sign in and create account links when not authenticated', async () => {
    useAuthStore.setState({
      session: null,
      status: 'unauthenticated' as const,
    });

    vi.mocked(invitationsApi.getByToken).mockResolvedValue(mockInvitation as any);

    render(<AcceptInvitationPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText("You've been invited!")).toBeInTheDocument();
    });

    // Should show invitation details
    expect(screen.getByText(/Northstar Labs/)).toBeInTheDocument();
    expect(screen.getByText(/Admin/)).toBeInTheDocument();

    // Should show sign in / create account buttons
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  // ── Authenticated: shows accept/decline buttons ──────────────────────
  it('shows accept and decline buttons when authenticated', async () => {
    useAuthStore.setState({
      session: { user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' } },
      status: 'authenticated' as const,
    });

    vi.mocked(invitationsApi.getByToken).mockResolvedValue(mockInvitation as any);

    render(<AcceptInvitationPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText("You're invited!")).toBeInTheDocument();
    });

    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  // ── Accepting navigates to workspace ─────────────────────────────────
  it('navigates to workspace on successful accept', async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      session: { user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' } },
      status: 'authenticated' as const,
    });

    vi.mocked(invitationsApi.getByToken).mockResolvedValue(mockInvitation as any);
    vi.mocked(invitationsApi.accept).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'ADMIN',
      name: 'Alice',
      email: 'alice@test.com',
      joinedAt: '2024-01-01T00:00:00.000Z',
    } as any);

    render(<AcceptInvitationPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText("You're invited!")).toBeInTheDocument();
    });

    const acceptButton = screen.getByText('Accept');
    await user.click(acceptButton);

    await waitFor(() => {
      expect(invitationsApi.accept).toHaveBeenCalledWith('valid-token');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/w/ws-1', { replace: true });
    });
  });
});
