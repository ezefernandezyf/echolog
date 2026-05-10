import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import type { BoardDTO, CreateBoardDTO } from '../../../shared/contracts/index.js';

export class BoardsService {
  async list(workspaceId: string): Promise<BoardDTO[]> {
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

  async create(workspaceId: string, input: CreateBoardDTO): Promise<BoardDTO> {
    const existing = await prisma.board.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: input.slug,
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
        slug: input.slug,
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
}

export const boardsService = new BoardsService();
