import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../../shared/components/theme-toggle', () => ({
  ThemeToggle: vi.fn(() => <button>Toggle theme</button>),
}));

vi.mock('../../../workspaces/components/pending-invitations-bell', () => ({
  PendingInvitationsBell: vi.fn(() => <div data-testid="bell">Bell</div>),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { Sidebar } from '../sidebar';
import { useAuthStore } from '../../../auth/auth-store';
import { useUiStore } from '../../../core/store/ui-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sampleItems = [
  { id: 'board-1', label: 'Features' },
  { id: 'board-2', label: 'Bugs' },
];

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSidebar(props: {
  workspaceName?: string;
  workspaceId?: string;
  items?: { id: string; label: string }[];
  activeItemId?: string;
}) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Sidebar
          workspaceName={props.workspaceName ?? 'Test Workspace'}
          workspaceId={props.workspaceId}
          items={props.items ?? sampleItems}
          activeItemId={props.activeItemId ?? 'board-1'}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    session: {
      user: { id: 'u-1', email: 'test@test.dev', name: 'Test User', emailVerified: false },
    },
    status: 'authenticated',
  } as never);
  useUiStore.setState({ sidebarOpen: true, theme: 'light' });
});

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Sidebar — Explore link conditional', () => {
  it('Explore link is visible when no workspaceId (dashboard /w)', () => {
    renderSidebar({ workspaceId: undefined });

    const exploreLink = screen.queryByText('Explore');
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink?.closest('a')).toHaveAttribute('href', '/explore');
  });

  it('Explore link is hidden when workspaceId is present', () => {
    renderSidebar({ workspaceId: 'ws-abc' });

    const exploreLink = screen.queryByText('Explore');
    expect(exploreLink).not.toBeInTheDocument();
  });

  it('Explore link reappears when switching from workspace to dashboard', () => {
    const { rerender } = renderSidebar({ workspaceId: 'ws-abc' });

    // Initially hidden
    expect(screen.queryByText('Explore')).not.toBeInTheDocument();

    // Rerender without workspaceId
    const queryClient = createQueryClient();
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Sidebar
            workspaceName="Test Workspace"
            workspaceId={undefined}
            items={sampleItems}
            activeItemId="board-1"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Now it should be visible
    expect(screen.queryByText('Explore')).toBeInTheDocument();
  });
});

describe('Sidebar — bottom section cleanup', () => {
  it('does not render ThemeToggle in sidebar', () => {
    renderSidebar({ workspaceId: 'ws-abc' });

    // ThemeToggle should not be in the sidebar DOM
    expect(screen.queryByText('Toggle theme')).not.toBeInTheDocument();
  });

  it('does not render PendingInvitationsBell in sidebar', () => {
    renderSidebar({ workspaceId: 'ws-abc' });

    // Bell should not be in sidebar
    expect(screen.queryByTestId('bell')).not.toBeInTheDocument();
  });

  it('does not render user profile card (initials/name/email)', () => {
    renderSidebar({ workspaceId: 'ws-abc' });

    // User email should not be visible in sidebar
    expect(screen.queryByText('test@test.dev')).not.toBeInTheDocument();
  });
});
