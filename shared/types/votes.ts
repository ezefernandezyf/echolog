import { z } from 'zod';

export const voteDtoSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime().optional(),
});

export type VoteDto = z.infer<typeof voteDtoSchema>;
