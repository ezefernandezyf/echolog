import { fetchJson } from './client';
import type { BoardDTO, CreateBoardDTO, UpdateBoardDTO } from '../../../shared/contracts/index.js';

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
