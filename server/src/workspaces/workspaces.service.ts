import { randomUUID } from 'node:crypto';
import { HttpError } from '../infra/http.js';
import type { CreateWorkspaceDTO, WorkspaceDTO } from '../../../shared/contracts/index.js';

const workspaces: WorkspaceDTO[] = [
  { id: 'workspace-1', name: 'Default Workspace', slug: 'default', role: 'OWNER' },
];

export class WorkspacesService {
  list() {
    return workspaces;
  }

  create(input: CreateWorkspaceDTO) {
    if (workspaces.some((workspace) => workspace.slug === input.slug)) {
      throw new HttpError('Workspace slug already exists', 409);
    }

    const workspace = { id: randomUUID(), name: input.name, slug: input.slug, role: 'OWNER' as const };
    workspaces.push(workspace);
    return workspace;
  }
}

export const workspacesService = new WorkspacesService();
