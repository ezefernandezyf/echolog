import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------
vi.mock('../../api/workspaces', () => ({
  workspaceApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/boards', () => ({
  boardApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/posts', () => ({
  postApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    deletePost: vi.fn(),
  },
}));

vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('../../api/board-requests', () => ({
  boardRequestsApi: {
    create: vi.fn(),
    update: vi.fn(),
    listPending: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks (hoisted)
// ---------------------------------------------------------------------------
import { workspaceApi } from '../../api/workspaces';
import { boardApi } from '../../api/boards';
import { postApi } from '../../api/posts';
import { authApi } from '../../api/auth';
import { boardRequestsApi } from '../../api/board-requests';
import { useWorkspaces, useCreateWorkspace } from '../use-workspaces';
import { useBoards } from '../use-boards';
import { useCreatePost, useDeletePost } from '../use-posts';
import { useLogin } from '../use-auth';
import { useCreateBoardRequest, useUpdateBoardRequest, usePendingRequests } from '../use-board-requests';
import { queryKeys } from '../query-keys';
import { useAuthStore } from '../../auth/auth-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const sampleWorkspaces = [
  {
    id: 'ws-1',
    name: 'Alpha',
    slug: 'alpha',
    role: 'OWNER' as const,
    visibility: 'PRIVATE' as const,
    publicAccessLevel: 'READ_ONLY' as const,
    adminsCanEditSettings: true,
    boardCreation: 'MEMBERS' as const,
    boardDeletion: 'ADMINS' as const,
    commenting: 'MEMBERS' as const,
    boardCreationPolicy: 'FREE' as const,
  },
  {
    id: 'ws-2',
    name: 'Beta',
    slug: 'beta',
    role: 'MEMBER' as const,
    visibility: 'PRIVATE' as const,
    publicAccessLevel: 'READ_ONLY' as const,
    adminsCanEditSettings: true,
    boardCreation: 'MEMBERS' as const,
    boardDeletion: 'ADMINS' as const,
    commenting: 'MEMBERS' as const,
    boardCreationPolicy: 'FREE' as const,
  },
];

const sampleBoards = [
  { id: 'board-1', workspaceId: 'ws-1', name: 'Features', slug: 'features', description: null },
  { id: 'board-2', workspaceId: 'ws-1', name: 'Bugs', slug: 'bugs', description: null },
];

const sampleSession = {
  user: { id: 'user-1', email: 'alice@echolog.dev', name: 'Alice' },
};

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
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
// R4: React Query Hooks — Component Data Fetching
// ===========================================================================

describe('R4 — React Query Hooks', () => {
  // -----------------------------------------------------------------------
  // 1. useWorkspaces returns loading state initially, then data
  // -----------------------------------------------------------------------
  describe('useWorkspaces', () => {
    it('returns loading state initially, then resolved data', async () => {
      vi.mocked(workspaceApi.list).mockResolvedValue(sampleWorkspaces);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useWorkspaces('user-1'), {
        wrapper: createWrapper(queryClient),
      });

      // Initial state: loading (enabled because userId is provided)
      expect(result.current.isPending).toBe(true);

      // Wait for data to resolve
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(sampleWorkspaces);
      expect(vi.mocked(workspaceApi.list)).toHaveBeenCalledTimes(1);
    });

    it('does not fetch when userId is undefined', () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useWorkspaces(undefined), {
        wrapper: createWrapper(queryClient),
      });

      // disabled because userId is falsy — no fetch, fetchStatus is idle
      // isPending is still true because there's no data ever fetched
      expect(result.current.fetchStatus).toBe('idle');
      expect(vi.mocked(workspaceApi.list)).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 2. useBoards returns data for a given workspaceId
  // -----------------------------------------------------------------------
  describe('useBoards', () => {
    it('returns data for a given workspaceId', async () => {
      vi.mocked(boardApi.list).mockResolvedValue(sampleBoards);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useBoards('ws-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(sampleBoards);
      expect(vi.mocked(boardApi.list)).toHaveBeenCalledWith('ws-1');
    });

    it('is disabled when workspaceId is undefined', () => {
      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useBoards(undefined), {
        wrapper: createWrapper(queryClient),
      });

      // disabled because workspaceId is falsy — no fetch, fetchStatus is idle
      expect(result.current.fetchStatus).toBe('idle');
      expect(vi.mocked(boardApi.list)).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 3. useCreateWorkspace mutation invalidates workspace cache on success
  // -----------------------------------------------------------------------
  describe('useCreateWorkspace', () => {
    it('calls workspaceApi.create and invalidates workspace cache on success', async () => {
      const newWorkspace = {
        id: 'ws-new',
        name: 'New',
        slug: 'new',
        role: 'OWNER' as const,
        visibility: 'PRIVATE' as const,
        publicAccessLevel: 'READ_ONLY' as const,
        adminsCanEditSettings: true,
        boardCreation: 'MEMBERS' as const,
        boardDeletion: 'ADMINS' as const,
        commenting: 'MEMBERS' as const,
        boardCreationPolicy: 'FREE' as const,
      };
      vi.mocked(workspaceApi.create).mockResolvedValue(newWorkspace);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      // Trigger the mutation
      result.current.mutate({ name: 'New' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(vi.mocked(workspaceApi.create)).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New' }),
      );
      expect(result.current.data).toEqual(newWorkspace);
      // Should invalidate the workspaces cache
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.workspaces.all });
    });
  });

  // -----------------------------------------------------------------------
  // 4. useLogin mutation calls auth API and returns session data
  // -----------------------------------------------------------------------
  describe('useLogin', () => {
    it('calls authApi.login and returns session data', async () => {
      vi.mocked(authApi.login).mockResolvedValue(sampleSession);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ email: 'alice@echolog.dev', password: 'secret123' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(vi.mocked(authApi.login)).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@echolog.dev' }),
      );
      expect(result.current.data).toEqual(sampleSession);
    });
  });

  // -----------------------------------------------------------------------
  // useCreatePost invalidates with 2-element prefix ['posts', boardId]
  // -----------------------------------------------------------------------
  describe('useCreatePost', () => {
    it('invalidates post query with 2-element key prefix on success', async () => {
      const createdPost = {
        id: 'new-post',
        workspaceId: 'ws-1',
        boardId: 'board-1',
        authorId: 'user-1',
        title: 'Test',
        body: 'Body',
        status: 'OPEN',
        voteCount: 0,
        commentCount: 0,
      };
      vi.mocked(postApi.create).mockResolvedValue(createdPost);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 'board-1', data: { title: 'Test', body: 'Body' } });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['posts', 'board-1'],
      });
    });

    it('does not invalidate when mutation fails', async () => {
      vi.mocked(postApi.create).mockRejectedValue(new Error('Server error'));

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 'board-x', data: { title: 'Fail', body: 'Body' } });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Invalidation should NOT be called on error
      const invalidationCalls = invalidateSpy.mock.calls.filter(
        (call) =>
          call.length > 0 &&
          typeof call[0] === 'object' &&
          call[0] !== null &&
          'queryKey' in call[0],
      );
      expect(invalidationCalls).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // useDeletePost — optimistic removal, invalidation, rollback
  // -----------------------------------------------------------------------
  describe('useDeletePost', () => {
    it('optimistically removes post from cache on mutate', async () => {
      vi.mocked(postApi.deletePost).mockResolvedValue(undefined);

      const queryClient = createTestQueryClient();

      // Pre-fill the cache with posts
      queryClient.setQueryData(['posts', 'board-1'], [
        { id: 'post-1', title: 'Post 1' },
        { id: 'post-2', title: 'Post 2' },
      ]);

      const { result } = renderHook(() => useDeletePost(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 'board-1', postId: 'post-1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Post should be removed from cache
      const cacheData = queryClient.getQueryData(['posts', 'board-1']) as Array<{ id: string }>;
      expect(cacheData).toHaveLength(1);
      expect(cacheData[0].id).toBe('post-2');
    });

    it('invalidates posts query on settle', async () => {
      vi.mocked(postApi.deletePost).mockResolvedValue(undefined);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Pre-fill cache
      queryClient.setQueryData(['posts', 'board-1'], [{ id: 'post-1' }]);

      const { result } = renderHook(() => useDeletePost(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 'board-1', postId: 'post-1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['posts', 'board-1'],
      });
    });

    it('rolls back optimistic removal on error', async () => {
      vi.mocked(postApi.deletePost).mockRejectedValue(new Error('Network error'));

      const queryClient = createTestQueryClient();

      // Pre-fill the cache
      const previousData = [
        { id: 'post-1', title: 'Post 1' },
        { id: 'post-2', title: 'Post 2' },
      ];
      queryClient.setQueryData(['posts', 'board-1'], previousData);

      const { result } = renderHook(() => useDeletePost(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardId: 'board-1', postId: 'post-1' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Cache should be restored to previous state
      const cacheData = queryClient.getQueryData(['posts', 'board-1']) as Array<{ id: string }>;
      expect(cacheData).toHaveLength(2);
      expect(cacheData).toEqual(previousData);
    });
  });

  // -----------------------------------------------------------------------
  // Phase 17-B: Board Request Hooks
  // -----------------------------------------------------------------------
  describe('usePendingRequests', () => {
    it('returns pending requests for a workspace', async () => {
      const mockRequests = [
        {
          id: 'br-1', workspaceId: 'ws-1', userId: 'user-1', userName: 'Alice',
          boardName: 'Feature Requests', boardSlug: 'feature-requests',
          status: 'PENDING' as const, createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      vi.mocked(boardRequestsApi.listPending).mockResolvedValue(mockRequests);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => usePendingRequests('ws-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRequests);
      expect(vi.mocked(boardRequestsApi.listPending)).toHaveBeenCalledWith('ws-1');
    });
  });

  describe('useCreateBoardRequest', () => {
    it('calls boardRequestsApi.create and invalidates pending cache on success', async () => {
      const mockRequest = {
        id: 'br-1', workspaceId: 'ws-1', userId: 'user-1', userName: 'Alice',
        boardName: 'New Board', boardSlug: 'new-board',
        status: 'PENDING' as const, createdAt: '2026-01-01T00:00:00Z',
      };
      vi.mocked(boardRequestsApi.create).mockResolvedValue(mockRequest);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateBoardRequest('ws-1'), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ boardName: 'New Board', boardSlug: 'new-board' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(vi.mocked(boardRequestsApi.create)).toHaveBeenCalledWith('ws-1', {
        boardName: 'New Board',
        boardSlug: 'new-board',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.boardRequests.pending('ws-1'),
      });
    });
  });

  describe('useUpdateBoardRequest', () => {
    it('calls boardRequestsApi.update and invalidates pending cache on success', async () => {
      const mockRequest = {
        id: 'br-1', workspaceId: 'ws-1', userId: 'user-1', userName: 'Alice',
        boardName: 'Feature Requests', boardSlug: 'feature-requests',
        status: 'APPROVED' as const, createdAt: '2026-01-01T00:00:00Z',
      };
      vi.mocked(boardRequestsApi.update).mockResolvedValue(mockRequest);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateBoardRequest('ws-1'), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({ requestId: 'br-1', data: { status: 'APPROVED' } });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(vi.mocked(boardRequestsApi.update)).toHaveBeenCalledWith('ws-1', 'br-1', {
        status: 'APPROVED',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.boardRequests.pending('ws-1'),
      });
    });
  });
});
