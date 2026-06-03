import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------
vi.mock('../../api/public', () => ({
  publicApi: {
    listWorkspaces: vi.fn(),
    getWorkspaceBySlug: vi.fn(),
    updateVisibility: vi.fn(),
  },
}));

vi.mock('../../api/auth', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { publicApi } from '../../api/public';
import { PublicLayout } from '../public-layout';
import { PublicLobby } from '../public-lobby';
import { PublicWorkspaceView } from '../public-workspace-view';
import { useAuthStore } from '../../auth/auth-store';
import type { PublicWorkspaceDetailDTO, PublicWorkspaceListDTO } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockPublicWorkspaces: PublicWorkspaceListDTO = {
  workspaces: [
    {
      id: 'ws-pub-1',
      name: 'Public Alpha',
      slug: 'public-alpha',
      memberCount: 5,
      postCount: 12,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ws-pub-2',
      name: 'Open Beta',
      slug: 'open-beta',
      memberCount: 3,
      postCount: 7,
      createdAt: new Date().toISOString(),
    },
  ],
  nextCursor: null,
};

const mockPublicWorkspaceDetail: PublicWorkspaceDetailDTO = {
  id: 'ws-pub-1',
  name: 'Public Alpha',
  slug: 'public-alpha',
  memberCount: 5,
  postCount: 12,
  visibility: 'PUBLIC',
  publicAccessLevel: 'READ_ONLY',
  createdAt: new Date().toISOString(),
  boards: [
    {
      id: 'bd-1',
      name: 'Feature Requests',
      slug: 'feature-requests',
      postCount: 8,
    },
    {
      id: 'bd-2',
      name: 'Bug Reports',
      slug: 'bug-reports',
      postCount: 4,
    },
  ],
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('PublicLayout', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' } as never);
  });

  it('renders the EchoLog branding link', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('EchoLog')).toBeInTheDocument();
  });

  it('shows Sign In button when not authenticated', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const signInButtons = screen.getAllByText('Sign In');
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  it('shows Dashboard button when authenticated', () => {
    useAuthStore.setState({
      session: { user: { id: 'u-1', email: 'test@test.dev', name: 'Test' } },
      status: 'authenticated',
    } as never);

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLayout />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const dashboardButtons = screen.getAllByText('Dashboard');
    expect(dashboardButtons.length).toBeGreaterThan(0);
  });
});

describe('PublicLobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace cards when data is available', async () => {
    vi.mocked(publicApi.listWorkspaces).mockResolvedValue(mockPublicWorkspaces);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLobby />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const items = screen.getAllByText('Public Alpha');
      expect(items.length).toBeGreaterThan(0);
    });
    const items2 = screen.getAllByText('Open Beta');
    expect(items2.length).toBeGreaterThan(0);
  });

  it('shows sort toggle buttons', async () => {
    vi.mocked(publicApi.listWorkspaces).mockResolvedValue(mockPublicWorkspaces);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLobby />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const recentBtns = screen.getAllByText('Recent');
      expect(recentBtns.length).toBeGreaterThan(0);
    });
    const popularBtns = screen.getAllByText('Popular');
    expect(popularBtns.length).toBeGreaterThan(0);
  });

  it('shows empty state when no workspaces', async () => {
    vi.mocked(publicApi.listWorkspaces).mockResolvedValue({
      workspaces: [],
      nextCursor: null,
    });
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PublicLobby />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No public workspaces yet/)).toBeInTheDocument();
    });
  });
});

describe('PublicWorkspaceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows workspace info and boards when found', async () => {
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockPublicWorkspaceDetail);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Wait for boards to appear (async query resolution)
    await waitFor(() => {
      const boards = screen.getAllByText(/Feature Requests|Bug Reports/);
      expect(boards.length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Public Alpha').length).toBeGreaterThan(0);
  });

  it('shows sign-in prompt for anonymous users', async () => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' } as never);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockPublicWorkspaceDetail);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const signInBtns = screen.getAllByText('Sign In');
      expect(signInBtns.length).toBeGreaterThan(0);
    });
  });

  it('shows read-only notice for logged-in non-member on READ_ONLY workspace', async () => {
    useAuthStore.setState({
      session: { user: { id: 'u-1', email: 'test@test.dev', name: 'Test' } },
      status: 'authenticated',
    } as never);

    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockPublicWorkspaceDetail);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/This workspace is read-only/);
      expect(elements.length).toBeGreaterThan(0);
    });

    // READ_ONLY: no create board button should exist
    expect(screen.queryByText('+ New Board')).not.toBeInTheDocument();
    expect(screen.queryByText('Create the first board')).not.toBeInTheDocument();
  });

  it('shows interact-mode indicator for logged-in non-member on INTERACT workspace', async () => {
    useAuthStore.setState({
      session: { user: { id: 'u-1', email: 'test@test.dev', name: 'Test' } },
      status: 'authenticated',
    } as never);

    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockPublicWorkspaceDetail,
      publicAccessLevel: 'INTERACT',
    });
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Interact mode/);
      expect(elements.length).toBeGreaterThan(0);
    });

    // INTERACT: no create board button
    expect(screen.queryByText('+ New Board')).not.toBeInTheDocument();
  });

  it('shows full-access indicator and create board button for logged-in non-member on FULL workspace', async () => {
    useAuthStore.setState({
      session: { user: { id: 'u-1', email: 'test@test.dev', name: 'Test' } },
      status: 'authenticated',
    } as never);

    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockPublicWorkspaceDetail,
      publicAccessLevel: 'FULL',
    });
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Full access mode/);
      expect(elements.length).toBeGreaterThan(0);
    });

    // FULL: create board button visible
    expect(screen.getByText('+ New Board')).toBeInTheDocument();
  });

  it('shows not-found message for unknown workspace', async () => {
    vi.mocked(publicApi.getWorkspaceBySlug).mockRejectedValue(new Error('Not found'));
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/unknown-slug']}>
          <Routes>
            <Route path="/explore/:slug" element={<PublicWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Workspace not found.')).toBeInTheDocument();
    });
  });
});
