import crypto from 'node:crypto';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export type UserRecord = {
  id: string;
  email: string;
  name?: string;
  password: string;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
};

export type MembershipRecord = {
  userId: string;
  workspaceId: string;
  role: Role;
};

export type BoardRecord = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
};

export type PostRecord = {
  id: string;
  workspaceId: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
};

export type VoteRecord = {
  postId: string;
  userId: string;
  createdAt: Date;
};

type ScaffoldStore = {
  users: Map<string, UserRecord>;
  sessions: Map<string, string>;
  workspaces: Map<string, WorkspaceRecord>;
  memberships: MembershipRecord[];
  boards: Map<string, BoardRecord>;
  posts: Map<string, PostRecord>;
  votes: Map<string, VoteRecord>;
};

const store: ScaffoldStore = {
  users: new Map(),
  sessions: new Map(),
  workspaces: new Map(),
  memberships: [],
  boards: new Map(),
  posts: new Map(),
  votes: new Map(),
};

export const scaffoldStore = store;

export const createId = (): string => crypto.randomUUID();

export const getVoteKey = (postId: string, userId: string): string => `${postId}:${userId}`;
