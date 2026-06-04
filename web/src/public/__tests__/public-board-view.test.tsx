import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { publicApi } from '../../api/public';
import { PublicBoardView } from '../public-board-view';
import type { PublicBoardDetailDTO } from '../../../../shared/contracts/index.js';

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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('PublicBoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board name and description when data loads', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha/feature-requests']}>
          <Routes>
            <Route path="/explore/:slug/:boardSlug" element={<PublicBoardView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const headings = screen.getAllByText('Feature Requests');
      expect(headings.length).toBeGreaterThanOrEqual(2); // breadcrumb + h1
    });

    expect(screen.getByText('Submit and vote on new features.')).toBeInTheDocument();
  });

  it('shows post titles and counts from board data', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockResolvedValue(mockBoardDetail);
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha/feature-requests']}>
          <Routes>
            <Route path="/explore/:slug/:boardSlug" element={<PublicBoardView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dark mode support')).toBeInTheDocument();
    });

    expect(screen.getByText('API integrations')).toBeInTheDocument();
    // Post count: verify the text "2 posts" exists after data loads
    await waitFor(() => {
      const allText = document.body.textContent ?? '';
      expect(allText).toContain('2 posts');
    });
  });

  it('shows back link to /explore when board not found', async () => {
    vi.mocked(publicApi.getBoardBySlug).mockRejectedValue(new Error('Not found'));
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/explore/public-alpha/nonexistent']}>
          <Routes>
            <Route path="/explore/:slug/:boardSlug" element={<PublicBoardView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/board not found/i)).toBeInTheDocument();
    });

    const backLink = screen.getByText(/back to discovery/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/explore');
  });
});
