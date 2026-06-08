import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { sanitizeInput } from '../infra/sanitize.js';
import { slugify } from '../../../shared/lib/slugify.js';
import { enforcePublicWriteAccess } from '../infra/public-access.js';
import { checkPermission } from '../infra/permissions.js';
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

  // Membership is enforced by requireWorkspaceMember middleware on the router.
  // For PUBLIC workspaces, non-member writes may still be allowed based on access level.
  async create(workspaceId: string, input: CreateBoardDTO, userId: string): Promise<BoardDTO> {
    // Check public access level for non-members on PUBLIC workspaces
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      await enforcePublicWriteAccess(workspaceId, 'CREATE_BOARD');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        boardCreation: true,
        boardCreationPolicy: true,
        boardDeletion: true,
      },
    });
    if (!workspace) {
      throw new HttpError('Workspace not found', 404);
    }

    // Gate board creation for workspace members
    if (membership) {
      if (workspace.boardCreationPolicy === 'ADMINS_ONLY') {
        if (!checkPermission('ADMINS', membership.role)) {
          throw new HttpError('Forbidden', 403);
        }
      } else if (workspace.boardCreationPolicy === 'APPROVAL_REQUIRED') {
        if (!checkPermission('ADMINS', membership.role)) {
          throw new HttpError('Forbidden', 403);
        }
      } else {
        // FREE policy — gate by boardCreation field
        const requiredLevel = workspace.boardCreation ?? 'MEMBERS';
        if (!checkPermission(requiredLevel, membership.role)) {
          throw new HttpError('Forbidden', 403);
        }
      }
    }

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

    return prisma.board.create({
      data: {
        workspaceId,
        name: sanitizeInput(input.name),
        slug,
        description: input.description ? sanitizeInput(input.description) : null,
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
        ...(input.name !== undefined && { name: sanitizeInput(input.name) }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && {
          description: input.description ? sanitizeInput(input.description) : null,
        }),
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

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: board.workspaceId } },
    });
    if (!membership) {
      throw new HttpError('Forbidden', 403);
    }

    // Read workspace boardDeletion permission level
    const workspace = await prisma.workspace.findUnique({
      where: { id: board.workspaceId },
      select: { boardDeletion: true },
    });
    if (!workspace) {
      throw new HttpError('Workspace not found', 404);
    }

    const requiredLevel = workspace.boardDeletion ?? 'ADMINS';
    if (!checkPermission(requiredLevel, membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    await prisma.board.delete({ where: { id: boardId } });
  }
}

export const boardsService = new BoardsService();
