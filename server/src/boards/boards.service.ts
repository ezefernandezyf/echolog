import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { slugify } from '../../../shared/lib/slugify.js';
import type { BoardDTO, CreateBoardDTO, UpdateBoardDTO } from '../../../shared/contracts/index.js';

export class BoardsService {
  // Membership is enforced by requireAnyMember middleware on the router.
  async list(workspaceId: string, _userId: string): Promise<BoardDTO[]> {
    return prisma.board.findMany({
      where: { workspaceId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  }

  // Membership is enforced by requireAnyMember middleware on the router.
  async create(workspaceId: string, input: CreateBoardDTO, _userId: string): Promise<BoardDTO> {
    const slug = slugify(input.name);

    const existing = await prisma.board.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug,
        },
      },
    });
    if (existing) {
      throw new HttpError('Board slug already exists', 409);
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      throw new HttpError('Workspace not found', 404);
    }

    return prisma.board.create({
      data: {
        workspaceId,
        name: input.name,
        slug,
        description: input.description ?? null,
      },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  }

  async update(boardId: string, input: UpdateBoardDTO, userId: string): Promise<BoardDTO> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    // Check workspace membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: board.workspaceId } },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    // If slug is being changed, check uniqueness within the workspace
    if (input.slug) {
      const existing = await prisma.board.findUnique({
        where: {
          workspaceId_slug: {
            workspaceId: board.workspaceId,
            slug: input.slug,
          },
        },
      });
      if (existing && existing.id !== boardId) {
        throw new HttpError('Board slug already exists in this workspace', 409);
      }
    }

    return prisma.board.update({
      where: { id: boardId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
      },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  }

  async delete(boardId: string, userId: string): Promise<void> {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      throw new HttpError('Board not found', 404);
    }

    // Only workspace admin/owner can delete boards
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: board.workspaceId } },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    await prisma.board.delete({ where: { id: boardId } });
  }
}

export const boardsService = new BoardsService();
