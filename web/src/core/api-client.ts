import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import type {
  AuthLoginDTO,
  AuthRegisterDTO,
  AuthSessionDTO,
  BoardDTO,
  CreateBoardDTO,
  CreatePostDTO,
  CreateWorkspaceDTO,
  InvitationDTO,
  MemberDTO,
  PostDTO,
  PostListFilters,
  PostListResponse,
  UpdateBoardDTO,
  UpdateEmailDTO,
  UpdatePasswordDTO,
  UpdateProfileDTO,
  UpdateProfileResult,
  UpdateWorkspaceDTO,
  WorkspaceDTO,
  WorkspaceRole,
  CommentDTO,
  CreateCommentDTO,
} from '../../../shared/contracts/index.js';

const DEFAULT_API_BASE_URL = '/api';

const resolveApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  return {
    ...config,
    withCredentials: true,
  };
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

interface ApiErrorBody {
  message?: string;
  error?: string;
  details?: unknown;
}

export interface ApiRequestConfig<TBody = unknown> extends Omit<
  AxiosRequestConfig<TBody>,
  'baseURL' | 'data' | 'method' | 'withCredentials'
> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: TBody;
}

function normalizeApiError(error: AxiosError<ApiErrorBody>): ApiError {
  return {
    message: error.response?.data?.message ?? error.response?.data?.error ?? error.message,
    status: error.response?.status,
    details: error.response?.data?.details ?? error.response?.data,
  };
}

export async function fetchJson<TResponse, TBody = unknown>(
  config: ApiRequestConfig<TBody>,
): Promise<TResponse> {
  const response = await apiClient.request<TResponse, AxiosResponse<TResponse>, TBody>({
    ...config,
    method: config.method ?? 'GET',
  });

  return response.data;
}

export function createFetcher<TResponse, TBody>(
  method: ApiRequestConfig<TBody>['method'],
  url: string,
) {
  return (data: TBody) => {
    return fetchJson<TResponse, TBody>({
      url,
      method,
      data,
    });
  };
}

export function createVoidFetcher<TResponse>(method: ApiRequestConfig['method'], url: string) {
  return () => {
    return fetchJson<TResponse, void>({
      url,
      method,
    });
  };
}

export const authApi = {
  me: createVoidFetcher<AuthSessionDTO>('GET', '/auth/me'),
  login: createFetcher<AuthSessionDTO, AuthLoginDTO>('POST', '/auth/login'),
  register: createFetcher<AuthSessionDTO, AuthRegisterDTO>('POST', '/auth/register'),
  logout: createVoidFetcher<void>('POST', '/auth/logout'),
  updateProfile: (data: UpdateProfileDTO) =>
    fetchJson<UpdateProfileResult, UpdateProfileDTO>({
      url: '/auth/profile',
      method: 'PATCH',
      data,
    }),
  updateEmail: (data: UpdateEmailDTO) =>
    fetchJson<{ user: { id: string; email: string; name: string | null } }, UpdateEmailDTO>({
      url: '/auth/email',
      method: 'PUT',
      data,
    }),
  updatePassword: (data: UpdatePasswordDTO) =>
    fetchJson<{ message: string }, UpdatePasswordDTO>({
      url: '/auth/password',
      method: 'PUT',
      data,
    }),
};

export const workspaceApi = {
  list: createVoidFetcher<WorkspaceDTO[]>('GET', '/workspaces'),
  create: createFetcher<WorkspaceDTO, CreateWorkspaceDTO>('POST', '/workspaces'),
  update: (workspaceId: string, data: UpdateWorkspaceDTO) =>
    fetchJson<WorkspaceDTO, UpdateWorkspaceDTO>({
      url: `/workspaces/${workspaceId}`,
      method: 'PATCH',
      data,
    }),
  delete: (workspaceId: string) =>
    fetchJson<void>({ url: `/workspaces/${workspaceId}`, method: 'DELETE' }),
};

export const boardApi = {
  list: (workspaceId: string) =>
    fetchJson<BoardDTO[]>({ url: `/workspaces/${workspaceId}/boards` }),
  create: (workspaceId: string, data: CreateBoardDTO) =>
    fetchJson<BoardDTO, CreateBoardDTO>({
      url: `/workspaces/${workspaceId}/boards`,
      method: 'POST',
      data,
    }),
  update: (workspaceId: string, boardId: string, data: UpdateBoardDTO) =>
    fetchJson<BoardDTO, UpdateBoardDTO>({
      url: `/workspaces/${workspaceId}/boards/${boardId}`,
      method: 'PATCH',
      data,
    }),
  delete: (workspaceId: string, boardId: string) =>
    fetchJson<void>({ url: `/workspaces/${workspaceId}/boards/${boardId}`, method: 'DELETE' }),
};

export const postApi = {
  list: (boardId: string, filters?: PostListFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.cursor) params.set('cursor', filters.cursor);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return fetchJson<PostListResponse>({ url: `/boards/${boardId}/posts${qs ? `?${qs}` : ''}` });
  },
  create: (boardId: string, data: CreatePostDTO) =>
    fetchJson<PostDTO, CreatePostDTO>({ url: `/boards/${boardId}/posts`, method: 'POST', data }),
  getById: (postId: string) => fetchJson<PostDTO>({ url: `/posts/${postId}` }),
  updateStatus: (boardId: string, postId: string, status: string) =>
    fetchJson<PostDTO>({
      url: `/boards/${boardId}/posts/${postId}/status`,
      method: 'PATCH',
      data: { status },
    }),
};

export const voteApi = {
  addVote: (postId: string) =>
    fetchJson<{ postId: string; userId: string; voteCount: number; voted: boolean }>({
      url: `/posts/${postId}/vote`,
      method: 'POST',
    }),
  removeVote: (postId: string) =>
    fetchJson<{ postId: string; userId: string; voteCount: number; voted: boolean }>({
      url: `/posts/${postId}/vote`,
      method: 'DELETE',
    }),
};

export const commentApi = {
  list: (postId: string) => fetchJson<CommentDTO[]>({ url: `/posts/${postId}/comments` }),
  create: (postId: string, data: CreateCommentDTO) =>
    fetchJson<CommentDTO, CreateCommentDTO>({
      url: `/posts/${postId}/comments`,
      method: 'POST',
      data,
    }),
  delete: (postId: string, commentId: string) =>
    fetchJson<void>({ url: `/posts/${postId}/comments/${commentId}`, method: 'DELETE' }),
};

export const membersApi = {
  list: (workspaceId: string) => fetchJson<MemberDTO[]>({ url: `/workspaces/${workspaceId}/members` }),
  changeRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
    fetchJson<MemberDTO, { role: WorkspaceRole }>({
      url: `/workspaces/${workspaceId}/members/${userId}`,
      method: 'PATCH',
      data: { role },
    }),
  remove: (workspaceId: string, userId: string) =>
    fetchJson<void>({ url: `/workspaces/${workspaceId}/members/${userId}`, method: 'DELETE' }),
};

export const invitationsApi = {
  create: (workspaceId: string, data: { email: string; role?: WorkspaceRole }) =>
    fetchJson<InvitationDTO, { email: string; role?: WorkspaceRole }>({
      url: `/workspaces/${workspaceId}/invitations`,
      method: 'POST',
      data,
    }),
  getByToken: (token: string) => fetchJson<InvitationDTO>({ url: `/invitations/${token}` }),
  accept: (token: string) => fetchJson<MemberDTO>({ url: `/invitations/${token}/accept`, method: 'POST' }),
  decline: (token: string) => fetchJson<void>({ url: `/invitations/${token}/decline`, method: 'POST' }),
  listPending: (workspaceId: string) => fetchJson<InvitationDTO[]>({ url: `/workspaces/${workspaceId}/invitations` }),
};

export { apiClient };
