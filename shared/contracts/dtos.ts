export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSessionDTO {
  user: AuthUserDTO;
}

export interface AuthRegisterDTO {
  email: string;
  password: string;
  name?: string | null;
}

export interface AuthLoginDTO {
  email: string;
  password: string;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

export interface CreateWorkspaceDTO {
  name: string;
  slug: string;
}

export interface BoardDTO {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface CreateBoardDTO {
  name: string;
  slug: string;
  description?: string | null;
}

export interface PostDTO {
  id: string;
  workspaceId: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
  status: string;
  voteCount: number;
  commentCount: number;
}

export interface CreatePostDTO {
  title: string;
  body: string;
}

export interface VoteDTO {
  postId: string;
  userId: string;
  voteCount: number;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface CreateCommentDTO {
  body: string;
}
