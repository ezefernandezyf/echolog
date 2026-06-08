import { fetchJson } from './client';
import type { BoardRequestDTO, CreateBoardRequestDTO, UpdateBoardRequestDTO } from '../../../shared/contracts/index.js';

export const boardRequestsApi = {
  create: (workspaceId: string, data: CreateBoardRequestDTO) =>
    fetchJson<BoardRequestDTO, CreateBoardRequestDTO>({
      url: `/workspaces/${workspaceId}/board-requests`,
      method: 'POST',
      data,
    }),
  update: (workspaceId: string, requestId: string, data: UpdateBoardRequestDTO) =>
    fetchJson<BoardRequestDTO, UpdateBoardRequestDTO>({
      url: `/workspaces/${workspaceId}/board-requests/${requestId}`,
      method: 'PATCH',
      data,
    }),
  listPending: (workspaceId: string) =>
    fetchJson<BoardRequestDTO[]>({
      url: `/workspaces/${workspaceId}/board-requests`,
    }),
};
