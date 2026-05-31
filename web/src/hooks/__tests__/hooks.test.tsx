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

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports after mocks (hoisted)
// ---------------------------------------------------------------------------
import { workspaceApi } from '../../api/workspaces';
import { boardApi } from '../../api/boards';
import { authApi } from '../../api/auth';
import { useWorkspaces, useCreateWorkspace } from '../use-workspaces';
import { useBoards } from '../use-boards';
import { useLogin } from '../use-auth';
import { queryKeys } from '../query-keys';
import { useAuthStore } from '../../auth/auth-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const sampleWorkspaces = [
  { id: 'ws-1', name: 'Alpha', slug: 'alpha', role: 'OWNER' as const },
  { id: 'ws-2', name: 'Beta', slug: 'beta', role: 'MEMBER' as const },
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
      const newWorkspace = { id: 'ws-new', name: 'New', slug: 'new', role: 'OWNER' as const };
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
});
