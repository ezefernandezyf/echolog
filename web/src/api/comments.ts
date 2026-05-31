import { fetchJson } from './client';
import type { CommentDTO, CreateCommentDTO } from '../../../shared/contracts/index.js';

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
