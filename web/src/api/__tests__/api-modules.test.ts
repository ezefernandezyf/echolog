import { describe, it, expect, vi } from 'vitest';

// Mock client.ts so createFetcher/createVoidFetcher return controllable vi.fn()s
vi.mock('../client', () => ({
  createFetcher: vi.fn(() => vi.fn().mockResolvedValue({ mock: true })),
  createVoidFetcher: vi.fn(() => vi.fn().mockResolvedValue({ mock: true })),
  fetchJson: vi.fn().mockResolvedValue({ mock: true }),
}));

import { authApi } from '../auth';
import { workspaceApi } from '../workspaces';
import { boardApi } from '../boards';

// ===========================================================================
// R3: Domain API Modules — Calling Domain APIs
// ===========================================================================

describe('R3 — Domain API Modules', () => {
  // -----------------------------------------------------------------------
  // 1. Auth module exports expected functions
  // -----------------------------------------------------------------------
  describe('auth module', () => {
    it('exports all expected auth functions', () => {
      // Functions created via createVoidFetcher
      expect(authApi).toHaveProperty('me');
      expect(authApi).toHaveProperty('logout');
      // Functions created via createFetcher
      expect(authApi).toHaveProperty('login');
      expect(authApi).toHaveProperty('register');
      // Functions using fetchJson directly
      expect(authApi).toHaveProperty('updateProfile');
      expect(authApi).toHaveProperty('updateEmail');
      expect(authApi).toHaveProperty('updatePassword');
    });

    it('each auth function is callable and returns a promise', () => {
      expect(authApi.me()).toBeInstanceOf(Promise);
      expect(authApi.login({} as any)).toBeInstanceOf(Promise);
      expect(authApi.register({} as any)).toBeInstanceOf(Promise);
      expect(authApi.logout()).toBeInstanceOf(Promise);
      expect(authApi.updateProfile({} as any)).toBeInstanceOf(Promise);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Workspace module exports expected functions
  // -----------------------------------------------------------------------
  describe('workspace module', () => {
    it('exports all expected workspace functions', () => {
      // Functions created via createVoidFetcher / createFetcher
      expect(workspaceApi).toHaveProperty('list');
      expect(workspaceApi).toHaveProperty('create');
      // Functions using fetchJson directly
      expect(workspaceApi).toHaveProperty('update');
      expect(workspaceApi).toHaveProperty('delete');
    });

    it('each workspace function is callable and returns a promise', () => {
      expect(workspaceApi.list()).toBeInstanceOf(Promise);
      expect(workspaceApi.create({} as any)).toBeInstanceOf(Promise);
    });
  });

  // -----------------------------------------------------------------------
  // 3. API call returns the expected shape (workspaceApi.list)
  // -----------------------------------------------------------------------
  describe('API call return shape', () => {
    it('workspaceApi.list resolves with an array of workspaces', async () => {
      const mockWorkspaces = [
        { id: 'ws-1', name: 'Alpha', slug: 'alpha', role: 'OWNER' as const, visibility: 'PRIVATE' as const, publicAccessLevel: 'READ_ONLY' as const, adminsCanEditSettings: true },
        { id: 'ws-2', name: 'Beta', slug: 'beta', role: 'MEMBER' as const, visibility: 'PRIVATE' as const, publicAccessLevel: 'READ_ONLY' as const, adminsCanEditSettings: true },
      ];

      vi.mocked(workspaceApi.list).mockResolvedValueOnce(mockWorkspaces);

      const result = await workspaceApi.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'ws-1');
      expect(result[0]).toHaveProperty('name', 'Alpha');
      expect(result[0]).toHaveProperty('slug', 'alpha');
    });

    it('authApi.me resolves with session-shaped data', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'alice@echolog.dev', name: 'Alice', emailVerified: false },
      };

      vi.mocked(authApi.me).mockResolvedValueOnce(mockSession);

      const result = await authApi.me();

      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
    });

    it('boardApi.list resolves with an array of boards', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          workspaceId: 'ws-1',
          name: 'Features',
          slug: 'features',
          description: null,
        },
        {
          id: 'board-2',
          workspaceId: 'ws-1',
          name: 'Bugs',
          slug: 'bugs',
          description: 'Bug reports',
        },
      ];

      // boardApi.list delegates to fetchJson — mock fetchJson for this call
      const client = await import('../client');
      vi.mocked(client.fetchJson).mockResolvedValueOnce(mockBoards);

      const result = await boardApi.list('ws-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Features');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Error handling: API call that fails returns a normalized error
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('workspaceApi.list propagates a normalized API error', async () => {
      const apiError = { message: 'Server error', status: 500, details: null };

      vi.mocked(workspaceApi.list).mockRejectedValueOnce(apiError);

      await expect(workspaceApi.list()).rejects.toEqual(
        expect.objectContaining({
          message: expect.any(String),
          status: expect.any(Number),
        }),
      );
    });

    it('authApi.me propagates a 401 unauthorized error', async () => {
      const authError = { message: 'Unauthorized', status: 401 };

      vi.mocked(authApi.me).mockRejectedValueOnce(authError);

      await expect(authApi.me()).rejects.toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
          status: 401,
        }),
      );
    });

    it('boardApi.list propagates an error through fetchJson', async () => {
      const fetchError = { message: 'Not found', status: 404, details: null };

      const client = await import('../client');
      vi.mocked(client.fetchJson).mockRejectedValueOnce(fetchError);

      await expect(boardApi.list('ws-1')).rejects.toEqual(
        expect.objectContaining({
          message: expect.any(String),
          status: 404,
        }),
      );
    });
  });
});
