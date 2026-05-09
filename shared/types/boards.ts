import { z } from 'zod';

export const boardDtoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
  description: z.string().max(500).nullable().optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

export type BoardDto = z.infer<typeof boardDtoSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
