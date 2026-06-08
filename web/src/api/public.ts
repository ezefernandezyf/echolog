import { fetchJson } from './client';
import type {
  PublicBoardDetailDTO,
  PublicWorkspaceDetailDTO,
  PublicWorkspaceListDTO,
  UpdateVisibilityDTO,
  WorkspaceDTO,
} from '../../../shared/contracts/index.js';

export const publicApi = {
  listWorkspaces: (sort?: 'recent' | 'popular', cursor?: string) =>
    fetchJson<PublicWorkspaceListDTO>({
      url: `/workspaces/public?sort=${sort ?? 'recent'}${cursor ? `&cursor=${cursor}` : ''}`,
    }),
  getWorkspaceBySlug: (slug: string) =>
    fetchJson<PublicWorkspaceDetailDTO>({
      url: `/workspaces/public/${slug}`,
    }),
  getBoardBySlug: (slug: string, boardSlug: string) =>
    fetchJson<PublicBoardDetailDTO>({
      url: `/workspaces/public/${slug}/boards/${boardSlug}`,
    }),
  updateVisibility: (workspaceId: string, data: UpdateVisibilityDTO) =>
    fetchJson<WorkspaceDTO, UpdateVisibilityDTO>({
      url: `/workspaces/${workspaceId}/visibility`,
      method: 'PATCH',
      data,
    }),
};
