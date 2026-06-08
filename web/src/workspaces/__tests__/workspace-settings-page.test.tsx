import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mocks — mock the hooks module directly since useWorkspaces() is called
// without userId (enabled: false), so we control the query result ourselves
// ---------------------------------------------------------------------------
vi.mock('../../hooks/use-workspaces', () => ({
  useWorkspaces: vi.fn(),
  useUpdateWorkspace: vi.fn(),
  useDeleteWorkspace: vi.fn(),
}));

vi.mock('../../hooks/use-public-workspaces', () => ({
  useUpdateVisibility: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  usePublicWorkspaces: vi.fn(),
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
import { useAuthStore } from '../../auth/auth-store';
import { useWorkspaces, useUpdateWorkspace, useDeleteWorkspace } from '../../hooks/use-workspaces';
import { useUpdateVisibility } from '../../hooks/use-public-workspaces';
import { WorkspaceSettingsPage } from '../components/workspace-settings-page';

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
      <MemoryRouter initialEntries={['/w/ws-1/settings']}>
        <Routes>
          <Route path="/w/:workspaceId/settings" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockMutation = (opts?: { onSuccessData?: unknown; onError?: Error }) => {
  const mutate = vi.fn(
    (
      _vars: unknown,
      callbacks?: { onSuccess?: (data: unknown) => void; onError?: (err: Error) => void },
    ) => {
      if (opts?.onError && callbacks?.onError) {
        callbacks.onError(opts.onError);
      } else if (callbacks?.onSuccess) {
        callbacks.onSuccess(opts?.onSuccessData ?? {});
      }
    },
  );
  return { mutate, isPending: false } as any;
};

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
describe('WorkspaceSettingsPage', () => {
  // ── Loading state ─────────────────────────────────────────────────────
  it('shows loading skeleton while fetching workspace data', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // ── Renders current workspace name and slug ──────────────────────────
  it('renders workspace name and slug in form fields', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'Northstar Labs', slug: 'northstar-labs', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY' }],
      isPending: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
    vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Northstar Labs');
      expect(nameInput).toBeInTheDocument();
    });

    const slugInput = screen.getByDisplayValue('northstar-labs');
    expect(slugInput).toBeInTheDocument();
  });

  // ── Edit form works with validation ──────────────────────────────────
  it('updates workspace name on form submission', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'Northstar Labs', slug: 'northstar-labs', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY' }],
      isPending: false,
      isError: false,
      error: null,
    } as any);

    const updateMutation = mockMutation({
      onSuccessData: { id: 'ws-1', name: 'Updated Name', slug: 'northstar-labs', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY' },
    });
    vi.mocked(useUpdateWorkspace).mockReturnValue(updateMutation);
    vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());

    const user = userEvent.setup();

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Northstar Labs')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Northstar Labs');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateMutation.mutate).toHaveBeenCalledWith(
        { workspaceId: 'ws-1', data: { name: 'Updated Name' } },
        expect.any(Object),
      );
    });
  });

  // ── Delete workspace shows typed confirmation ────────────────────────
  it('opens delete confirmation dialog and navigates on success', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'Northstar Labs', slug: 'northstar-labs', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY' }],
      isPending: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
    const deleteMutation = mockMutation({ onSuccessData: undefined });
    vi.mocked(useDeleteWorkspace).mockReturnValue(deleteMutation);

    const user = userEvent.setup();

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Northstar Labs')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText('Delete Workspace');
    await user.click(deleteButton);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The dialog is portaled to document.body — find the confirm input and type workspace name
    const dialog = screen.getByRole('dialog');
    const confirmInput = within(dialog).getByPlaceholderText('Northstar Labs');
    await user.type(confirmInput, 'Northstar Labs');

    // Click the confirm button (match role="button" to avoid the <h2> title)
    const confirmButton = within(dialog).getByRole('button', { name: 'Delete Workspace' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteMutation.mutate).toHaveBeenCalled();
    });
  });

  // ── Error state: not found ────────────────────────────────────────────
  it('shows "workspace not found" when workspace does not exist', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      error: null,
    } as any);

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Workspace not found')).toBeInTheDocument();
    });
  });

  // ── Renders Members and Danger Zone sections ─────────────────────────
  it('renders Members section with manage link and Danger Zone', async () => {
    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'Northstar Labs', slug: 'northstar-labs', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY' }],
      isPending: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
    vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());

    render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Northstar Labs')).toBeInTheDocument();
    });

    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Manage Members')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  // ── 16-B.1: ConfirmDialog before visibility mutation ──────────────────
  describe('Visibility change ConfirmDialog', () => {
    const ownerWorkspace = {
      id: 'ws-1', name: 'Test WS', slug: 'test-ws', role: 'OWNER' as const,
      visibility: 'PRIVATE' as const, publicAccessLevel: 'READ_ONLY' as const,
    };

    beforeEach(() => {
      useAuthStore.setState({
        session: { user: { id: 'user-1', email: 'test@test.dev', name: 'Test', emailVerified: false } },
        status: 'authenticated',
      } as never);
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [ownerWorkspace],
        isPending: false,
        isError: false,
        error: null,
      } as any);
      vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
      vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());
    });

    it('shows ConfirmDialog when changing visibility from PRIVATE to PUBLIC, before any mutation', async () => {
      const updateVisibilityMutate = vi.fn();
      vi.mocked(useUpdateVisibility).mockReturnValue({
        mutate: updateVisibilityMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();
      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      // Verify visibility section rendered and select starts at PRIVATE
      const visibilitySelect = screen.getByRole('combobox', { name: /status/i }) as HTMLSelectElement;
      expect(visibilitySelect.value).toBe('PRIVATE');

      // Change visibility select from PRIVATE to PUBLIC
      await user.selectOptions(visibilitySelect, 'PUBLIC');

      // ConfirmDialog should appear BEFORE mutation is called
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Mutation should NOT have been called yet
      expect(updateVisibilityMutate).not.toHaveBeenCalled();
    });

    it('calls mutation when user confirms in ConfirmDialog', async () => {
      const updateVisibilityMutate = vi.fn();
      vi.mocked(useUpdateVisibility).mockReturnValue({
        mutate: updateVisibilityMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();
      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      const visibilitySelect = screen.getByRole('combobox', { name: /status/i }) as HTMLSelectElement;
      await user.selectOptions(visibilitySelect, 'PUBLIC');

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Confirm the dialog
      const dialog = screen.getByRole('dialog');
      const confirmBtn = within(dialog).getByRole('button', { name: /make public/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(updateVisibilityMutate).toHaveBeenCalled();
      });
    });

    it('reverts select when user cancels ConfirmDialog without calling mutation', async () => {
      const updateVisibilityMutate = vi.fn();
      vi.mocked(useUpdateVisibility).mockReturnValue({
        mutate: updateVisibilityMutate,
        isPending: false,
      } as any);

      const user = userEvent.setup();
      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      const visibilitySelect = screen.getByRole('combobox', { name: /status/i }) as HTMLSelectElement;
      await user.selectOptions(visibilitySelect, 'PUBLIC');

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Cancel the dialog
      const dialog = screen.getByRole('dialog');
      const cancelBtn = within(dialog).getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      // Dialog should close and mutation NOT called
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(updateVisibilityMutate).not.toHaveBeenCalled();

      // Select should be reverted to PRIVATE
      expect(visibilitySelect.value).toBe('PRIVATE');
    });

    it('shows ConfirmDialog when changing access level, and confirms mutation', async () => {
      const updateVisibilityMutate = vi.fn();
      vi.mocked(useUpdateVisibility).mockReturnValue({
        mutate: updateVisibilityMutate,
        isPending: false,
      } as any);

      // Start with PUBLIC visibility to render access level select
      vi.mocked(useWorkspaces).mockReturnValue({
        data: [{ ...ownerWorkspace, visibility: 'PUBLIC' as const }],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      const user = userEvent.setup();
      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      // Access level select should be visible (workspace is PUBLIC)
      const accessLevelSelect = screen.getByRole('combobox', { name: /access level/i }) as HTMLSelectElement;
      expect(accessLevelSelect.value).toBe('READ_ONLY');

      // Change to FULL
      await user.selectOptions(accessLevelSelect, 'FULL');

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(updateVisibilityMutate).not.toHaveBeenCalled();

      // Confirm
      const dialog = screen.getByRole('dialog');
      const confirmBtn = within(dialog).getByRole('button', { name: /make public/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(updateVisibilityMutate).toHaveBeenCalled();
      });
    });
  });

  // ── 17-A: Admins can edit settings toggle ────────────────────────────
  describe('adminsCanEditSettings toggle', () => {
    it('shows toggle only for workspace OWNER', async () => {
      useAuthStore.setState({
        session: { user: { id: 'user-1', email: 'test@test.dev', name: 'Owner', emailVerified: false } },
        status: 'authenticated',
      } as never);

      vi.mocked(useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', name: 'Test WS', slug: 'test-ws', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY', adminsCanEditSettings: true }],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
      vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());

      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      expect(screen.getByText('Admins can edit settings')).toBeInTheDocument();
    });

    it('hides toggle for workspace ADMIN', async () => {
      useAuthStore.setState({
        session: { user: { id: 'user-2', email: 'admin@test.dev', name: 'Admin', emailVerified: false } },
        status: 'authenticated',
      } as never);

      vi.mocked(useWorkspaces).mockReturnValue({
        data: [{ id: 'ws-1', name: 'Test WS', slug: 'test-ws', role: 'ADMIN', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY', adminsCanEditSettings: true }],
        isPending: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(useUpdateWorkspace).mockReturnValue(mockMutation());
      vi.mocked(useDeleteWorkspace).mockReturnValue(mockMutation());

      render(<WorkspaceSettingsPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test WS')).toBeInTheDocument();
      });

      expect(screen.queryByText('Admins can edit settings')).not.toBeInTheDocument();
    });
  });
});
