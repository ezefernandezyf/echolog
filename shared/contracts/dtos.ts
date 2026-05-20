export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

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
  name: string;
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
}

export interface UpdateWorkspaceDTO {
  name?: string;
  slug?: string;
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
  description?: string | null;
}

export interface UpdateBoardDTO {
  name?: string;
  slug?: string;
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
  authorName?: string | null;
  isUpvoted?: boolean;
}

export interface CreatePostDTO {
  title: string;
  body: string;
}

export interface VoteDTO {
  postId: string;
  userId: string;
  voteCount: number;
  voted: boolean;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  authorName?: string | null;
}

export interface CreateCommentDTO {
  body: string;
}

export interface PostListFilters {
  status?: string;
  search?: string;
  sort?: 'trending' | 'top' | 'new';
  cursor?: string;
  limit?: number;
}

export interface PostListResponse {
  posts: PostDTO[];
  nextCursor: string | null;
}

export interface UpdateProfileDTO {
  name: string;
}

export interface UpdateEmailDTO {
  email: string;
  currentPassword: string;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileResult {
  user: AuthUserDTO;
}

export interface MemberDTO {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  name: string | null;
  email: string;
  joinedAt: string;
}

export interface InvitationDTO {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedEmail: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
}

export interface CreateInvitationDTO {
  email: string;
  role?: WorkspaceRole;
}

export interface ChangeRoleDTO {
  role: WorkspaceRole;
}
