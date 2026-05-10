import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { CreateWorkspaceDTO, WorkspaceDTO } from '../../../shared/contracts/index.js';

export class WorkspacesService {
  async list(): Promise<WorkspaceDTO[]> {
    const workspaces = await prisma.workspace.findMany({
      include: { members: true },
    });

    return workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      role: 'OWNER', // TODO: derive from membership when filtering by user
    }));
  }

  async create(input: CreateWorkspaceDTO, userId: string): Promise<WorkspaceDTO> {
    const existing = await prisma.workspace.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new HttpError('Workspace slug already exists', 409);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: 'OWNER',
    };
  }
}

export const workspacesService = new WorkspacesService();
