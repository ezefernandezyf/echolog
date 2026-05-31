import { createFetcher, createVoidFetcher, fetchJson } from './client';
import type {
  WorkspaceDTO,
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
} from '../../../shared/contracts/index.js';

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
