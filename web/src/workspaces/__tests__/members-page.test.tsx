import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/members', () => ({
  membersApi: { list: vi.fn(), changeRole: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../api/invitations', () => ({
  invitationsApi: { listPending: vi.fn() },
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
import { membersApi } from '../../api/members';
import { invitationsApi } from '../../api/invitations';
import { MembersPage } from '../components/members-page';
import { useAuthStore } from '../../auth/auth-store';
import type { MemberDTO, InvitationDTO } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockMembers: MemberDTO[] = [
  {
    userId: 'owner-1',
    workspaceId: 'ws-1',
    role: 'OWNER',
    name: 'Alice Owner',
    email: 'alice@test.com',
    joinedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    userId: 'admin-1',
    workspaceId: 'ws-1',
    role: 'ADMIN',
    name: 'Bob Admin',
    email: 'bob@test.com',
    joinedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    userId: 'member-1',
    workspaceId: 'ws-1',
    role: 'MEMBER',
    name: 'Charlie Member',
    email: 'charlie@test.com',
    joinedAt: '2024-01-03T00:00:00.000Z',
  },
  {
    userId: 'viewer-1',
    workspaceId: 'ws-1',
    role: 'VIEWER',
    name: null,
    email: 'diana@test.com',
    joinedAt: '2024-01-04T00:00:00.000Z',
  },
];

const mockInvitations: InvitationDTO[] = [
  {
    id: 'inv-1',
    workspaceId: 'ws-1',
    workspaceName: 'Test Workspace',
    invitedEmail: 'pending@test.com',
    role: 'MEMBER',
    status: 'PENDING',
    token: 'token-1',
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
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/w/ws-1/members']}>
        <Routes>
          <Route path="/w/:workspaceId/members" element={children} />
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
  useAuthStore.setState({
    session: { user: { id: 'owner-1', email: 'alice@test.com', name: 'Alice Owner' } },
    status: 'authenticated' as const,
  });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MembersPage', () => {
  // ── Loading state ─────────────────────────────────────────────────────
  it('shows loading skeleton while fetching members', async () => {
    // Never resolve — keeps loading
    vi.mocked(membersApi.list).mockReturnValue(new Promise(() => {}));
    vi.mocked(invitationsApi.listPending).mockReturnValue(new Promise(() => {}));

    render(<MembersPage />, { wrapper: TestWrapper });

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── Error state ───────────────────────────────────────────────────────
  it('shows error alert with retry on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(membersApi.list).mockRejectedValue(new Error('Failed to load'));
    vi.mocked(invitationsApi.listPending).mockRejectedValue(new Error('Failed'));

    render(<MembersPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Failed to load members')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
  });

  // ── Not a member state ────────────────────────────────────────────────
  it('shows not-a-member message when current user has no membership', async () => {
    vi.mocked(membersApi.list).mockResolvedValue([]);
    vi.mocked(invitationsApi.listPending).mockResolvedValue([]);

    render(<MembersPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('You are not a member of this workspace.')).toBeInTheDocument();
    });
  });

  // ── Success: renders member list ─────────────────────────────────────
  it('renders member list with names, emails, and roles', async () => {
    vi.mocked(membersApi.list).mockResolvedValue(mockMembers);
    vi.mocked(invitationsApi.listPending).mockResolvedValue(mockInvitations);

    render(<MembersPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    expect(screen.getByText('Charlie Member')).toBeInTheDocument();
    // Viewer with null name should show email-based initials (uppercased)
    expect(screen.getByText('DI')).toBeInTheDocument();

    // Check role badges (may have multiple matches from <option> elements)
    expect(screen.getByText('Owner')).toBeInTheDocument();
    const adminElements = screen.getAllByText('Admin');
    expect(adminElements.length).toBeGreaterThanOrEqual(1);
    const memberElements = screen.getAllByText('Member');
    expect(memberElements.length).toBeGreaterThanOrEqual(1);
    const viewerElements = screen.getAllByText('Viewer');
    expect(viewerElements.length).toBeGreaterThanOrEqual(1);

    // Admin should see invite form + pending invitations section
    expect(screen.getByText('Invite Member')).toBeInTheDocument();
    expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
  });

  // ── Admin actions: change role ───────────────────────────────────────
  it('allows admin to change member role', async () => {
    const user = userEvent.setup();
    vi.mocked(membersApi.list).mockResolvedValue(mockMembers);
    vi.mocked(invitationsApi.listPending).mockResolvedValue([]);
    vi.mocked(membersApi.changeRole).mockResolvedValue({
      ...mockMembers[1],
      role: 'MEMBER',
    } as any);

    const { container } = render(<MembersPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    // Find all native <select> elements in the member list (skip the invite form select)
    const selects = container.querySelectorAll<HTMLSelectElement>('select.rounded-lg');
    // First member select is for Bob Admin (first non-owner/self member)
    await user.selectOptions(selects[0], 'MEMBER');

    await waitFor(() => {
      expect(membersApi.changeRole).toHaveBeenCalledWith('ws-1', 'admin-1', 'MEMBER');
    });
  });

  // ── Admin actions: remove member ─────────────────────────────────────
  it('allows admin to remove a member via confirm dialog', async () => {
    const user = userEvent.setup();
    vi.mocked(membersApi.list).mockResolvedValue(mockMembers);
    vi.mocked(invitationsApi.listPending).mockResolvedValue([]);
    vi.mocked(membersApi.remove).mockResolvedValue(undefined);

    render(<MembersPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Charlie Member')).toBeInTheDocument();
    });

    // Click Remove for Charlie (third Remove button — Bob, Charlie, then Leave for self)
    const removeButtons = screen.getAllByText('Remove');
    await user.click(removeButtons[1]);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The dialog has a "Remove" confirm button — there are now 3 Remove buttons
    // (two in list, one in dialog), so use getAllByText and pick the last one
    const confirmButtons = screen.getAllByText('Remove');
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(membersApi.remove).toHaveBeenCalledWith('ws-1', 'member-1');
    });
  });
});
