import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { slugify } from '../../../shared/lib/slugify.js';
import type {
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  WorkspaceDTO,
} from '../../../shared/contracts/index.js';

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

  async getById(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { workspace: true },
    });

    if (!member) {
      throw new HttpError('Workspace not found', 404);
    }

    return { workspace: member.workspace, role: member.role };
  }

  async create(input: CreateWorkspaceDTO, userId: string): Promise<WorkspaceDTO> {
    const slug = slugify(input.name);

    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      throw new HttpError('Workspace slug already exists', 409);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
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

  async update(
    workspaceId: string,
    input: UpdateWorkspaceDTO,
    userId: string,
  ): Promise<WorkspaceDTO> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    // If slug is being changed, check uniqueness
    if (input.slug) {
      const existing = await prisma.workspace.findUnique({ where: { slug: input.slug } });
      if (existing && existing.id !== workspaceId) {
        throw new HttpError('Workspace slug already exists', 409);
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: membership.role,
    };
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership || membership.role !== 'OWNER') {
      throw new HttpError('Forbidden: only the workspace owner can delete it', 403);
    }

    await prisma.workspace.delete({ where: { id: workspaceId } });
  }
}

export const workspacesService = new WorkspacesService();
