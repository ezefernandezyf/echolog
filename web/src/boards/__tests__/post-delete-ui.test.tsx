import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/votes', () => ({
  voteApi: { addVote: vi.fn(), removeVote: vi.fn() },
}));

vi.mock('../../api/posts', () => ({
  postApi: {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    getById: vi.fn(),
    deletePost: vi.fn(),
  },
}));

vi.mock('../../api/comments', () => ({
  commentApi: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../hooks/use-workspaces', () => ({
  useWorkspaces: vi.fn(() => ({
    data: [],
    isPending: false,
  })),
  useUpdateWorkspace: vi.fn(),
  useDeleteWorkspace: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useAuthStore } from '../../auth/auth-store';
import { useWorkspaces } from '../../hooks/use-workspaces';
import { PostRow, type PostRowData } from '../components/post-row';

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
      <MemoryRouter initialEntries={['/w/ws-1']}>
        <Routes>
          <Route path="/w/:workspaceId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPostRow(post: PostRowData) {
  return render(<PostRow post={post} boardId="board-1" />, {
    wrapper: TestWrapper,
  });
}

function makePost(overrides: Partial<PostRowData> = {}): PostRowData {
  return {
    id: 'post-1',
    title: 'Test Post',
    description: 'Test body',
    status: 'OPEN',
    upvotes: 3,
    comments: 1,
    isUpvoted: false,
    author: 'user-alice',
    createdAt: '2026-01-15T10:00:00Z',
    trendScore: 42,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ session: null, status: 'unknown' });
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// Tests
// ===========================================================================
describe('PostRow delete button visibility', () => {
  // ── Author sees delete button ──────────────────────────────────────────
  it('shows delete button when current user is the post author', () => {
    useAuthStore.setState({
      session: { user: { id: 'user-alice', email: 'alice@test.dev', name: 'Alice', emailVerified: false } },
      status: 'authenticated',
    });

    renderPostRow(makePost({ author: 'user-alice' }));

    expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
  });

  // ── Admin sees delete button ───────────────────────────────────────────
  it('shows delete button when current user is workspace ADMIN', () => {
    useAuthStore.setState({
      session: { user: { id: 'user-bob', email: 'bob@test.dev', name: 'Bob', emailVerified: false } },
      status: 'authenticated',
    });

    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'WS', slug: 'ws', role: 'ADMIN', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY', adminsCanEditSettings: true }],
      isPending: false,
    } as ReturnType<typeof useWorkspaces>);

    renderPostRow(makePost({ author: 'user-alice' }));

    expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
  });

  // ── Owner sees delete button ───────────────────────────────────────────
  it('shows delete button when current user is workspace OWNER', () => {
    useAuthStore.setState({
      session: { user: { id: 'user-owner', email: 'owner@test.dev', name: 'Owner', emailVerified: false } },
      status: 'authenticated',
    });

    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'WS', slug: 'ws', role: 'OWNER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY', adminsCanEditSettings: true }],
      isPending: false,
    } as ReturnType<typeof useWorkspaces>);

    renderPostRow(makePost({ author: 'user-alice' }));

    expect(screen.getByRole('button', { name: /delete post/i })).toBeInTheDocument();
  });

  // ── Regular member does NOT see delete button ──────────────────────────
  it('hides delete button for non-author member', () => {
    useAuthStore.setState({
      session: { user: { id: 'user-member', email: 'member@test.dev', name: 'Member', emailVerified: false } },
      status: 'authenticated',
    });

    vi.mocked(useWorkspaces).mockReturnValue({
      data: [{ id: 'ws-1', name: 'WS', slug: 'ws', role: 'MEMBER', visibility: 'PRIVATE', publicAccessLevel: 'READ_ONLY', adminsCanEditSettings: true }],
      isPending: false,
    } as ReturnType<typeof useWorkspaces>);

    renderPostRow(makePost({ author: 'user-alice' }));

    expect(screen.queryByRole('button', { name: /delete post/i })).not.toBeInTheDocument();
  });

  // ── Anonymous user does NOT see delete button ──────────────────────────
  it('hides delete button for anonymous users', () => {
    renderPostRow(makePost({ author: 'user-alice' }));

    expect(screen.queryByRole('button', { name: /delete post/i })).not.toBeInTheDocument();
  });
});
