import { randomUUID } from 'node:crypto';
import { HttpError } from '../../lib/http.js';
import type { BoardDTO, CreateBoardDTO } from '../../../../shared/contracts/index.js';

const boards: BoardDTO[] = [
  { id: 'board-1', workspaceId: 'workspace-1', name: 'Feedback', slug: 'feedback', description: 'Feature requests' },
];

export class BoardsService {
  list(workspaceId: string) {
    return boards.filter((board) => board.workspaceId === workspaceId);
  }

  create(workspaceId: string, input: CreateBoardDTO) {
    if (boards.some((board) => board.workspaceId === workspaceId && board.slug === input.slug)) {
      throw new HttpError('Board slug already exists', 409);
    }

    const board = {
      id: randomUUID(),
      workspaceId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    };

    boards.push(board);
    return board;
  }
}

export const boardsService = new BoardsService();
