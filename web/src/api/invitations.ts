import { createVoidFetcher, fetchJson } from './client';
import type { InvitationDTO, MemberDTO, WorkspaceRole } from '../../../shared/contracts/index.js';

export const invitationsApi = {
  create: (workspaceId: string, data: { email: string; role?: WorkspaceRole }) =>
    fetchJson<InvitationDTO, { email: string; role?: WorkspaceRole }>({
      url: `/workspaces/${workspaceId}/invitations`,
      method: 'POST',
      data,
    }),
  getByToken: (token: string) => fetchJson<InvitationDTO>({ url: `/invitations/${token}` }),
  accept: (token: string) =>
    fetchJson<MemberDTO>({ url: `/invitations/${token}/accept`, method: 'POST' }),
  decline: (token: string) =>
    fetchJson<void>({ url: `/invitations/${token}/decline`, method: 'POST' }),
  cancel: (workspaceId: string, invitationId: string) =>
    fetchJson<void>({
      url: `/workspaces/${workspaceId}/invitations/${invitationId}`,
      method: 'DELETE',
    }),
  listPending: (workspaceId: string) =>
    fetchJson<InvitationDTO[]>({ url: `/workspaces/${workspaceId}/invitations` }),
  listMine: createVoidFetcher<InvitationDTO[]>('GET', '/invitations/pending'),
};
