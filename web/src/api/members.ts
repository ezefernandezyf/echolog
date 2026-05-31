import { fetchJson } from './client';
import type { MemberDTO, WorkspaceRole } from '../../../shared/contracts/index.js';

export const membersApi = {
  list: (workspaceId: string) =>
    fetchJson<MemberDTO[]>({ url: `/workspaces/${workspaceId}/members` }),
  changeRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
    fetchJson<MemberDTO, { role: WorkspaceRole }>({
      url: `/workspaces/${workspaceId}/members/${userId}`,
      method: 'PATCH',
      data: { role },
    }),
  remove: (workspaceId: string, userId: string) =>
    fetchJson<void>({ url: `/workspaces/${workspaceId}/members/${userId}`, method: 'DELETE' }),
};
