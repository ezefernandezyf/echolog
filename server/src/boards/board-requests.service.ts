import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { sanitizeInput } from '../infra/sanitize.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { boardsService } from './boards.service.js';
import type {
  CreateBoardRequestDTO,
  UpdateBoardRequestDTO,
  BoardRequestDTO,
} from '../../../shared/contracts/index.js';

export class BoardRequestsService {
  async create(
    workspaceId: string,
    userId: string,
    input: CreateBoardRequestDTO,
  ): Promise<BoardRequestDTO> {
    const boardSlug = input.boardSlug.trim();

    // Validate slug uniqueness against Board table
    const existingBoard = await prisma.board.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId,
          slug: boardSlug,
        },
      },
    });
    if (existingBoard) {
      throw new HttpError('Board slug already exists', 409);
    }

    // Validate slug uniqueness against BoardRequest table (any PENDING)
    const existingRequest = await prisma.boardRequest.findFirst({
      where: { workspaceId, boardSlug, status: 'PENDING' },
    });
    if (existingRequest) {
      throw new HttpError('Board slug already requested', 409);
    }

    // Check for duplicate PENDING from same user + slug
    const duplicate = await prisma.boardRequest.findFirst({
      where: { workspaceId, userId, boardSlug, status: 'PENDING' },
    });
    if (duplicate) {
      throw new HttpError('Duplicate pending request', 409);
    }

    const boardName = sanitizeInput(input.boardName.trim());

    const request = await prisma.boardRequest.create({
      data: {
        workspaceId,
        userId,
        boardName,
        boardSlug,
        status: 'PENDING',
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Notify workspace admins and owner
    const adminsAndOwner = await prisma.workspaceMember.findMany({
      where: { workspaceId, role: { in: ['ADMIN', 'OWNER'] } },
    });

    const requesterName = request.user.name ?? 'A user';
    const notificationMsg = `${requesterName} requested to create board "${boardName}"`;

    for (const member of adminsAndOwner) {
      await notificationsService.create({
        userId: member.userId,
        type: 'BOARD_REQUEST',
        message: notificationMsg,
        workspaceId,
        actorId: userId,
        link: `/w/${workspaceId}/board-requests`,
      });
    }

    return {
      id: request.id,
      workspaceId: request.workspaceId,
      userId: request.userId,
      userName: request.user.name,
      boardName: request.boardName,
      boardSlug: request.boardSlug,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async update(
    requestId: string,
    userId: string,
    input: UpdateBoardRequestDTO,
  ): Promise<BoardRequestDTO> {
    const boardRequest = await prisma.boardRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { name: true } },
      },
    });
    if (!boardRequest) {
      throw new HttpError('Board request not found', 404);
    }

    // Verify user is ADMIN or OWNER of the workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: boardRequest.workspaceId,
        },
      },
    });
    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    // Verify request is PENDING (not already processed)
    if (boardRequest.status !== 'PENDING') {
      throw new HttpError('This request has already been processed', 409);
    }

    const newStatus = input.status;

    if (newStatus === 'APPROVED') {
      // Create the board via boardsService
      await boardsService.create(
        boardRequest.workspaceId,
        { name: boardRequest.boardName, description: null },
        boardRequest.userId,
      );

      // Update request status
      await prisma.boardRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      // Notify requester
      await notificationsService.create({
        userId: boardRequest.userId,
        type: 'BOARD_REQUEST',
        message: `Your board request for "${boardRequest.boardName}" was approved`,
        workspaceId: boardRequest.workspaceId,
      });
    } else {
      // REJECTED
      await prisma.boardRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      // Notify requester
      await notificationsService.create({
        userId: boardRequest.userId,
        type: 'BOARD_REQUEST',
        message: `Your board request for "${boardRequest.boardName}" was rejected`,
        workspaceId: boardRequest.workspaceId,
      });
    }

    return {
      id: boardRequest.id,
      workspaceId: boardRequest.workspaceId,
      userId: boardRequest.userId,
      userName: boardRequest.user.name,
      boardName: boardRequest.boardName,
      boardSlug: boardRequest.boardSlug,
      status: newStatus,
      createdAt: boardRequest.createdAt.toISOString(),
    };
  }
}

export const boardRequestsService = new BoardRequestsService();
