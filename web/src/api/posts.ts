import { fetchJson } from './client';
import type {
  PostDTO,
  CreatePostDTO,
  PostListFilters,
  PostListResponse,
} from '../../../shared/contracts/index.js';

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
