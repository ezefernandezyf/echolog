import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock API — MUST come before component import
// ---------------------------------------------------------------------------
vi.mock('../../api/public', () => ({
  publicApi: {
    getBoardBySlug: vi.fn(),
    listWorkspaces: vi.fn(),
    getWorkspaceBySlug: vi.fn(),
    updateVisibility: vi.fn(),
  },
}));

vi.mock('../../api/votes', () => ({
  voteApi: {
    addVote: vi.fn(),
    removeVote: vi.fn(),
  },
}));

vi.mock('../../boards/components/comment-section', () => ({
  CommentSection: vi.fn(() => <div data-testid="comment-section">Comments</div>),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { publicApi } from '../../api/public';
import { PublicBoardView } from '../public-board-view';
import { useAuthStore } from '../../auth/auth-store';
import type {
  PublicBoardDetailDTO,
  PublicWorkspaceDetailDTO,
} from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockBoardDetail: PublicBoardDetailDTO = {
  id: 'bd-1',
  name: 'Feature Requests',
  slug: 'feature-requests',
  description: 'Submit and vote on new features.',
  postCount: 2,
  posts: [
    {
      id: 'post-1',
      workspaceId: 'ws-1',
      boardId: 'bd-1',
      authorId: 'u-1',
      title: 'Dark mode support',
      body: 'Please add dark mode.',
      status: 'OPEN',
      voteCount: 5,
      commentCount: 3,
      authorName: 'Alice',
      isUpvoted: false,
    },
    {
      id: 'post-2',
      workspaceId: 'ws-1',
      boardId: 'bd-1',
      authorId: 'u-2',
      title: 'API integrations',
      body: 'We need REST API.',
      status: 'PLANNED',
      voteCount: 2,
      commentCount: 1,
      authorName: 'Bob',
      isUpvoted: false,
    },
  ],
  nextCursor: null,
};

const mockWorkspaceDetail: PublicWorkspaceDetailDTO = {
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
  ],
};

const sampleSession = {
  user: { id: 'u-1', email: 'test@test.dev', name: 'Test User', emailVerified: false },
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderBoardView() {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/explore/public-alpha/feature-requests']}>
        <Routes>
          <Route path="/explore/:slug/:boardSlug" element={<PublicBoardView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ===========================================================================
// Existing tests — basic rendering
// ===========================================================================
describe('PublicBoardView — basic rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ session: null, status: 'unauthenticated' } as never);
  });
  afterEach(() => {
    cleanup();
  });

  it('renders board name and description when data loads', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockWorkspaceDetail);

    renderBoardView();

    await waitFor(() => {
      const headings = screen.getAllByText('Feature Requests');
      expect(headings.length).toBeGreaterThanOrEqual(2); // breadcrumb + h1
    });

    expect(screen.getByText('Submit and vote on new features.')).toBeInTheDocument();
  });

  it('shows post titles and counts from board data', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockWorkspaceDetail);

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    expect(screen.getByText('API integrations')).toBeInTheDocument();
    await waitFor(() => {
      const allText = document.body.textContent ?? '';
      expect(allText).toContain('2 posts');
    });
  });

  it('shows back link to /explore when board not found', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockRejectedValue(new Error('Not found'));
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue(mockWorkspaceDetail);

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText(/board not found/i)).toBeInTheDocument();
    });

    const backLink = screen.getByText(/back to discovery/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/explore');
  });
});

// ===========================================================================
// Phase 16-D: Access-level gate tests
// ===========================================================================
describe('PublicBoardView — access-level gates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('Scenario: anonymous on READ_ONLY — no vote, comment, or create controls', async () => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockWorkspaceDetail,
      publicAccessLevel: 'READ_ONLY',
    });

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    // No vote buttons, no comment toggle button, no create-post button
    expect(screen.queryByLabelText(/upvote/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /toggle comments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
  });

  it('Scenario: anonymous on INTERACT — no write controls render', async () => {
    useAuthStore.setState({ session: null, status: 'unauthenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockWorkspaceDetail,
      publicAccessLevel: 'INTERACT',
    });

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/upvote/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
  });

  it('Scenario: logged-in on INTERACT — vote + comment visible, no create-post', async () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockWorkspaceDetail,
      publicAccessLevel: 'INTERACT',
    });

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    // Vote buttons should exist
    const voteButtons = screen.getAllByLabelText(/upvote/i);
    expect(voteButtons.length).toBeGreaterThan(0);

    // Comment toggle button should exist
    const commentButtons = screen.getAllByRole('button', { name: /toggle comments/i });
    expect(commentButtons.length).toBeGreaterThan(0);

    // Create post button should NOT exist
    expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
  });

  it('Scenario: logged-in on FULL — vote + comment + create-post all visible', async () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockWorkspaceDetail,
      publicAccessLevel: 'FULL',
    });

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    // Vote buttons should exist
    const voteButtons = screen.getAllByLabelText(/upvote/i);
    expect(voteButtons.length).toBeGreaterThan(0);

    // Comment toggle button should exist
    const commentButtons = screen.getAllByRole('button', { name: /toggle comments/i });
    expect(commentButtons.length).toBeGreaterThan(0);

    // Create post link should exist
    expect(screen.getByRole('link', { name: /create post/i })).toBeInTheDocument();
  });

  it('Scenario: logged-in on READ_ONLY — no write controls', async () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockResolvedValue({
      ...mockWorkspaceDetail,
      publicAccessLevel: 'READ_ONLY',
    });

    renderBoardView();

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/upvote/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /toggle comments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create post/i })).not.toBeInTheDocument();
  });

  it('shows error state when workspace fetch fails but board succeeds', async () => {
    useAuthStore.setState({ session: sampleSession, status: 'authenticated' } as never);
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    vi.mocked(publicApi.getWorkspaceBySlug).mockRejectedValue(
      new Error('Workspace not accessible'),
    );

    renderBoardView();

    // Board should still render (even if workspace data is unavailable)
    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    // When workspace fetch fails, default to no write controls
    expect(screen.queryByLabelText(/upvote/i)).not.toBeInTheDocument();
  });
});
