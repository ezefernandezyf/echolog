import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { authApi } from '../../api/auth';
import { UserSettingsPage } from '../settings-page';
import { useAuthStore } from '../../auth/auth-store';

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
  useAuthStore.setState({
    session: {
      user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', emailVerified: false },
    },
    status: 'authenticated' as const,
  });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('UserSettingsPage', () => {
  // ── Renders profile form with current user data ───────────────────────
  it('renders profile form with current user name', async () => {
    render(<UserSettingsPage />, { wrapper: TestWrapper });

    // Profile section
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue('Alice');
    expect(nameInput).toBeInTheDocument();

    // Email section
    expect(screen.getByText('Email')).toBeInTheDocument();
    const emailInput = screen.getByDisplayValue('alice@test.com');
    expect(emailInput).toBeInTheDocument();

    // Password section
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  // ── Name update works ────────────────────────────────────────────────
  it('updates profile name on form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      user: { id: 'user-1', email: 'alice@test.com', name: 'Alice Updated', emailVerified: false },
    } as any);

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    const nameInput = screen.getByDisplayValue('Alice');
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Updated');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({ name: 'Alice Updated' });
    });
  });

  // ── Email update works ────────────────────────────────────────────────
  it('updates email on form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.updateEmail).mockResolvedValue({
      user: { id: 'user-1', email: 'newemail@test.com', name: 'Alice', emailVerified: false },
    } as any);

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    const emailInput = screen.getByDisplayValue('alice@test.com');
    await user.clear(emailInput);
    await user.type(emailInput, 'newemail@test.com');

    // Find the password field in the email section (first "Enter your current password")
    const passwordFields = screen.getAllByPlaceholderText('Enter your current password');
    await user.type(passwordFields[0], 'mypassword');

    const changeEmailButton = screen.getByText('Change Email');
    await user.click(changeEmailButton);

    await waitFor(() => {
      expect(authApi.updateEmail).toHaveBeenCalledWith({
        email: 'newemail@test.com',
        currentPassword: 'mypassword',
      });
    });
  });

  // ── Password change works ────────────────────────────────────────────
  it('changes password on form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.updatePassword).mockResolvedValue({
      message: 'Password changed',
    } as any);

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    const passwordFields = screen.getAllByPlaceholderText('Enter your current password');
    const newPasswordField = screen.getByPlaceholderText('At least 8 characters');

    await user.type(passwordFields[1], 'oldpass123');
    await user.type(newPasswordField, 'newpass12345');

    const changePasswordButton = screen.getByText('Change Password');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(authApi.updatePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpass12345',
      });
    });
  });

  // ── Error states ──────────────────────────────────────────────────────
  it('shows error toast when profile update fails', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.updateProfile).mockRejectedValue(new Error('Name is too long'));

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    const nameInput = screen.getByDisplayValue('Alice');
    await user.clear(nameInput);
    await user.type(nameInput, 'A Very Long Name That Should Work');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalled();
    });
  });

  // ── Email section renders with current password field ─────────────────
  it('renders current password field in email section', () => {
    render(<UserSettingsPage />, { wrapper: TestWrapper });

    // Should have two "current password" fields (one for email, one for password)
    const currentPasswordFields = screen.getAllByPlaceholderText('Enter your current password');
    expect(currentPasswordFields).toHaveLength(2);
  });

  // ── Password section renders with new password field ──────────────────
  it('renders new password field in password section', () => {
    render(<UserSettingsPage />, { wrapper: TestWrapper });

    expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument();
  });

  // ── Verification badge ───────────────────────────────────────────────

  it('shows unverified badge when emailVerified is false', () => {
    useAuthStore.setState({
      session: {
        user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', emailVerified: false },
      },
      status: 'authenticated' as const,
    });

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('Unverified')).toBeInTheDocument();
    expect(screen.getByText('Resend verification email')).toBeInTheDocument();
  });

  it('shows verified badge when emailVerified is true', () => {
    useAuthStore.setState({
      session: {
        user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', emailVerified: true },
      },
      status: 'authenticated' as const,
    });

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    expect(screen.getByText('Verified')).toBeInTheDocument();
    // Resend button should NOT be present when verified
    expect(screen.queryByText('Resend verification email')).not.toBeInTheDocument();
  });

  it('sends resend verification request on button click', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      session: {
        user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', emailVerified: false },
      },
      status: 'authenticated' as const,
    });
    vi.mocked(authApi.resendVerification).mockResolvedValue({ message: 'sent' } as any);

    render(<UserSettingsPage />, { wrapper: TestWrapper });

    const resendButton = screen.getByText('Resend verification email');
    await user.click(resendButton);

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalled();
    });
  });
});
