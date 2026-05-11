import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { CreateWorkspaceDTO, WorkspaceDTO } from '../../../shared/contracts/index.js';

export class WorkspacesService {
  async list(userId: string): Promise<WorkspaceDTO[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
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
