import { z } from 'zod';

export const postDtoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  boardId: z.string(),
  authorId: z.string(),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(5000),
  voteCount: z.number().int().nonnegative().optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(5000),
});

export type PostDto = z.infer<typeof postDtoSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
