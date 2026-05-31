import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/invitations', () => ({
  invitationsApi: {
    getByToken: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
    cancel: vi.fn(),
    listPending: vi.fn(),
    listMine: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../api/notifications', () => ({
  notificationsApi: {
    list: vi.fn(),
    listUnread: vi.fn(),
    countUnread: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
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
import { PendingInvitationsBell } from '../components/pending-invitations-bell';
import { notificationsApi } from '../../api/notifications';
import { invitationsApi } from '../../api/invitations';
import type { InvitationDTO, NotificationDTO } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockInvitations: InvitationDTO[] = [
  {
    id: 'inv-1',
    workspaceId: 'ws-1',
    workspaceName: 'Northstar Labs',
    invitedEmail: 'alice@test.com',
    role: 'ADMIN',
    status: 'PENDING',
    token: 'token-1',
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    workspaceId: 'ws-2',
    workspaceName: 'Growth Team',
    invitedEmail: 'alice@test.com',
    role: 'MEMBER',
    status: 'PENDING',
    token: 'token-2',
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
];

const mockNotifications: NotificationDTO[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'INVITE_SENT',
    message: 'You were invited to **Northstar Labs**',
    read: false,
    link: '/invite/token-1',
    actorId: 'actor-1',
    workspaceId: 'ws-1',
    createdAt: '2024-06-01T00:00:00.000Z',
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
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  // Default: no invitations, no notifications
  vi.mocked(invitationsApi.listMine).mockResolvedValue([] as any);
  vi.mocked(notificationsApi.listUnread).mockResolvedValue([] as any);
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PendingInvitationsBell', () => {
  // ── Shows unread count badge ──────────────────────────────────────────
  it('shows badge with total count when there are notifications or invitations', async () => {
    vi.mocked(invitationsApi.listMine).mockResolvedValue(mockInvitations as any);
    vi.mocked(notificationsApi.listUnread).mockResolvedValue(mockNotifications as any);

    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // ── No badge when count is 0 ─────────────────────────────────────────
  it('does not show badge when there are no notifications or invitations', async () => {
    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });

    // Badge should not exist
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  // ── Dropdown opens on click ─────────────────────────────────────────
  it('opens dropdown when bell is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.listMine).mockResolvedValue(mockInvitations as any);

    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications (2)')).toBeInTheDocument();
    });

    const bell = screen.getByLabelText('Notifications (2)');
    await user.click(bell);

    // Dropdown should now be visible with pending invitations section
    await waitFor(() => {
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
    });

    expect(screen.getByText('Northstar Labs')).toBeInTheDocument();
    expect(screen.getByText('Growth Team')).toBeInTheDocument();
  });

  // ── Lists pending invitations in dropdown ────────────────────────────
  it('shows accept and decline buttons for each invitation', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.listMine).mockResolvedValue(mockInvitations as any);
    vi.mocked(invitationsApi.accept).mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      role: 'ADMIN',
      name: 'Alice',
      email: 'alice@test.com',
      joinedAt: new Date().toISOString(),
    } as any);

    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications (2)')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Notifications (2)'));

    await waitFor(() => {
      expect(screen.getAllByText('Accept')).toHaveLength(2);
      expect(screen.getAllByText('Decline')).toHaveLength(2);
    });

    const acceptButtons = screen.getAllByText('Accept');
    await user.click(acceptButtons[0]);

    await waitFor(() => {
      expect(invitationsApi.accept).toHaveBeenCalledWith('token-1');
    });
  });

  // ── Shows empty state ────────────────────────────────────────────────
  it('shows empty state when no invitations or notifications', async () => {
    const user = userEvent.setup();

    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Notifications'));

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    // "View all notifications" link should be present
    expect(screen.getByText('View all notifications')).toBeInTheDocument();
  });

  // ── Shows notifications section ──────────────────────────────────────
  it('shows system notifications in dropdown', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationsApi.listUnread).mockResolvedValue(mockNotifications as any);

    render(<PendingInvitationsBell />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByLabelText('Notifications (1)')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Notifications (1)'));

    await waitFor(() => {
      expect(screen.getByText('You were invited to **Northstar Labs**')).toBeInTheDocument();
    });

    // "Mark all as read" button should be present
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });
});
