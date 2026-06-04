export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: ['auth', 'session'] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    list: (userId?: string) => ['workspaces', userId] as const,
    detail: (id: string) => ['workspaces', id] as const,
  },
  boards: {
    all: ['boards'] as const,
    list: (workspaceId: string) => ['boards', workspaceId] as const,
    detail: (boardId: string) => ['boards', boardId] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (boardId: string, filters?: Record<string, unknown>) =>
      ['posts', boardId, filters] as const,
    detail: (postId: string) => ['post', postId] as const,
  },
  comments: {
    all: ['comments'] as const,
    list: (postId: string) => ['comments', postId] as const,
  },
  members: {
    all: ['members'] as const,
    list: (workspaceId: string) => ['members', workspaceId] as const,
  },
  invitations: {
    all: ['invitations'] as const,
    list: (workspaceId: string) => ['invitations', workspaceId] as const,
    pending: ['invitations', 'pending'] as const,
    detail: (token: string) => ['invitation', token] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (scope: 'all' | 'unread') => ['notifications', scope] as const,
    unread: ['notifications', 'unread'] as const,
    count: ['notifications', 'count'] as const,
  },
  public: {
    workspaces: (sort?: 'recent' | 'popular') => ['public-workspaces', sort ?? 'recent'] as const,
    workspaceDetail: (slug: string) => ['public-workspace', slug] as const,
    boardDetail: (slug: string, boardSlug: string) => ['public-board', slug, boardSlug] as const,
  },
};
