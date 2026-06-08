import type { Request, Response } from 'express';
import { boardRequestsService } from './board-requests.service.js';

export const createBoardRequest = async (req: Request, res: Response) => {
  const data = await boardRequestsService.create(
    req.params.workspaceId as string,
    req.userId!,
    req.body,
  );
  res.status(201).json(data);
};

export const updateBoardRequest = async (req: Request, res: Response) => {
  const data = await boardRequestsService.update(
    req.params.requestId as string,
    req.userId!,
    req.body,
  );
  res.status(200).json(data);
};
