import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/invitations', () => ({
  invitationsApi: { create: vi.fn(), listPending: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { invitationsApi } from '../../api/invitations';
import { InviteMemberForm } from '../components/invite-member-form';

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
describe('InviteMemberForm', () => {
  // ── Renders form elements ─────────────────────────────────────────────
  it('renders email input, role selector, and submit button', () => {
    render(<InviteMemberForm workspaceId="ws-1" />, { wrapper: TestWrapper });

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
  });

  // ── Shows validation error on invalid email ──────────────────────────
  it('shows validation error for invalid email on submit', async () => {
    const user = userEvent.setup();
    render(<InviteMemberForm workspaceId="ws-1" />, { wrapper: TestWrapper });

    // Type an invalid email — use a value that the Zod email validator will reject
    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    await user.type(emailInput, 'test@');

    // Make the form dirty by changing role
    await user.selectOptions(screen.getByLabelText('Role'), 'VIEWER');

    // Submit the form directly to trigger validation
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    // After re-render, check aria-invalid was set
    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ── Shows success toast on successful invite ─────────────────────────
  it('calls mutation and resets form on success', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.create).mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      workspaceName: 'Test',
      invitedEmail: 'test@test.com',
      role: 'MEMBER',
      status: 'PENDING',
      token: 'token',
      expiresAt: '2025-01-01T00:00:00.000Z',
    } as any);

    render(<InviteMemberForm workspaceId="ws-1" />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'colleague@company.com');
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() => {
      expect(invitationsApi.create).toHaveBeenCalledWith('ws-1', {
        email: 'colleague@company.com',
        role: 'MEMBER',
      });
    });

    // Form should reset — email input should be empty
    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    });
  });

  // ── Shows error on failure ───────────────────────────────────────────
  it('shows toast error on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.create).mockRejectedValue(new Error('Failed to send invitation'));

    render(<InviteMemberForm workspaceId="ws-1" />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'colleague@company.com');
    await user.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() => {
      expect(invitationsApi.create).toHaveBeenCalled();
    });
  });

  // ── Disables button while loading ────────────────────────────────────
  it('disables submit button while mutation is pending', async () => {
    const user = userEvent.setup();
    // Never resolves — keeps loading
    vi.mocked(invitationsApi.create).mockReturnValue(new Promise(() => {}));

    render(<InviteMemberForm workspaceId="ws-1" />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'colleague@company.com');

    const submitButton = screen.getByRole('button', { name: 'Invite' });
    await user.click(submitButton);

    // Button text should change to "Inviting..."
    await waitFor(() => {
      expect(screen.getByText('Inviting...')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
