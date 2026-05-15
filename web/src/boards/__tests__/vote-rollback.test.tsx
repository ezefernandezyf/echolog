import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mock the API client — vi.mock is hoisted, so use vi.fn() inside the factory
// ---------------------------------------------------------------------------
vi.mock('../../core/api-client', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  workspaceApi: { list: vi.fn(), create: vi.fn() },
  boardApi: { list: vi.fn(), create: vi.fn() },
  postApi: {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  voteApi: { addVote: vi.fn(), removeVote: vi.fn() },
  commentApi: { list: vi.fn(), create: vi.fn() },
  apiClient: {},
  fetchJson: vi.fn(),
  createFetcher: vi.fn(),
  createVoidFetcher: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Import the mocked module AFTER the mock declaration
import { voteApi } from '../../core/api-client';
import { PostRow, type PostRowData } from '../components/post-row';
import type { PostListResponse } from '../../../../shared/contracts/index.js';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const boardId = 'board-1';

function makePost(overrides: Partial<PostRowData> = {}): PostRowData {
  return {
    id: 'post-1',
    title: 'Dark mode support',
    description: 'Add a system-wide dark mode toggle',
    status: 'OPEN',
    upvotes: 5,
    comments: 2,
    isUpvoted: false,
    author: 'Alice',
    createdAt: '2026-01-15T10:00:00Z',
    trendScore: 42,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface RenderPostRowResult {
  queryClient: QueryClient;
}

function renderPostRow(post: PostRowData): ReturnType<typeof render> & RenderPostRowResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Pre-populate the cache so onMutate can snapshot it for rollback
  queryClient.setQueryData(['posts', boardId], [post]);

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/w/ws-test']}>
        <PostRow post={post} boardId={boardId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...renderResult, queryClient };
}

function renderPostRowWithListResponse(
  post: PostRowData,
): ReturnType<typeof render> & RenderPostRowResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Test data is PostRowData-shaped; cast satisfies the PostListResponse contract
  const response = {
    posts: [post],
    nextCursor: null,
  } as unknown as PostListResponse;

  queryClient.setQueryData(
    ['posts', boardId, { status: null, sort: 'Trending', cursor: null }],
    response,
  );

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/w/ws-test']}>
        <PostRow post={post} boardId={boardId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...renderResult, queryClient };
}

// Helper to read the cached posts after a mutation
function getCachedPost(queryClient: QueryClient): PostRowData | undefined {
  const posts = queryClient.getQueryData<PostRowData[]>(['posts', boardId]);
  return posts?.[0];
}

// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ===========================================================================
// Tests
// ===========================================================================
describe('PostRow vote interactions', () => {
  // -----------------------------------------------------------------------
  // 1. Clicking vote toggles the cache optimistically
  // -----------------------------------------------------------------------
  it('optimistically toggles the vote count in the cache on click', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockResolvedValue({
      postId: post.id,
      userId: 'user-1',
      voteCount: 6,
      voted: true,
    });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    // The optimistic update (onMutate) should reflect immediately in the cache.
    // PostRow renders from props, not from cache, so we assert on the cache directly.
    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.isUpvoted).toBe(true);
      expect(cached?.upvotes).toBe(6);
    });
  });

  // -----------------------------------------------------------------------
  // 1b. The updater must also handle cached PostListResponse objects
  // -----------------------------------------------------------------------
  it('updates vote state when the posts cache entry is a PostListResponse object', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockResolvedValue({
      postId: post.id,
      userId: 'user-1',
      voteCount: 6,
      voted: true,
    });

    const { queryClient } = renderPostRowWithListResponse(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    await waitFor(() => {
      const cached = queryClient.getQueryData<PostListResponse>([
        'posts',
        boardId,
        { status: null, sort: 'Trending', cursor: null },
      ]);
      // Cast: cache objects are PostRowData-shaped at runtime (set via makePost)
      const cachedPost = cached?.posts[0] as PostRowData | undefined;
      expect(cachedPost?.isUpvoted).toBe(true);
      expect(cachedPost?.upvotes).toBe(6);
    });
  });

  // -----------------------------------------------------------------------
  // 2. On server error, the vote state rolls back
  // -----------------------------------------------------------------------
  it('rolls back the optimistic update when the server returns an error', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockRejectedValue({ status: 500, message: 'Internal server error' });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    // onMutate fires first (upvotes → 6, isUpvoted → true)
    // then onError fires and rolls back to previousPosts (upvotes → 5, isUpvoted → false)
    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.isUpvoted).toBe(false);
      expect(cached?.upvotes).toBe(5);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Cache reconciled with server data after successful vote
  // -----------------------------------------------------------------------
  it('reconciles cache with server data after successful toggle', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockResolvedValue({
      postId: post.id,
      userId: 'user-1',
      voteCount: 6,
      voted: true,
    });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    // After mutation succeeds, onSuccess reconciles cache with server state.
    // The optimistic update goes to upvotes=6, and onSuccess confirms it.
    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.isUpvoted).toBe(true);
      expect(cached?.upvotes).toBe(6);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Toggling off an existing vote (removing vote)
  // -----------------------------------------------------------------------
  it('optimistically removes a vote when already upvoted', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 7, isUpvoted: true });

    vi.mocked(voteApi.removeVote).mockResolvedValue({
      postId: post.id,
      userId: 'user-1',
      voteCount: 6,
      voted: false,
    });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', {
      name: `Remove vote from ${post.title}`,
    });
    await user.click(voteButton);

    // Optimistic: upvotes should decrease in cache
    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.upvotes).toBe(6);
      expect(cached?.isUpvoted).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Rapid double-clicks are prevented (race condition guard)
  // -----------------------------------------------------------------------
  it('disables the vote button while mutation is pending to prevent double-clicks', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    // Never resolve — mutation stays pending forever
    vi.mocked(voteApi.addVote).mockImplementation(
      () =>
        new Promise(() => {
          /* never settles */
        }),
    );

    renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });

    // First click — triggers mutation, lock acquired in onMutate
    await user.click(voteButton);

    // The button should be disabled after the first click
    // (both voteLockRef.current and isPending are true, button has disabled={...})
    await waitFor(() => {
      expect(voteButton).toBeDisabled();
    });

    // Verify mutationFn was called exactly once (the click passed disabled check)
    expect(vi.mocked(voteApi.addVote)).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // 6. Rollback on 409 Conflict (duplicate vote)
  // -----------------------------------------------------------------------
  it('rolls back the cache on 409 Conflict', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 5, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockRejectedValue({ status: 409, message: 'Already voted' });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    // After rollback, cache should be back to original state
    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.upvotes).toBe(5);
      expect(cached?.isUpvoted).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Network error rollback
  // -----------------------------------------------------------------------
  it('rolls back on network error (status 0)', async () => {
    const user = userEvent.setup();
    const post = makePost({ upvotes: 8, isUpvoted: false });

    vi.mocked(voteApi.addVote).mockRejectedValue({ status: 0, message: 'Network Error' });

    const { queryClient } = renderPostRow(post);

    const voteButton = screen.getByRole('button', { name: `Upvote ${post.title}` });
    await user.click(voteButton);

    await waitFor(() => {
      const cached = getCachedPost(queryClient);
      expect(cached?.upvotes).toBe(8);
      expect(cached?.isUpvoted).toBe(false);
    });
  });
});
