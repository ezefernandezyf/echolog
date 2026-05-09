import { z } from 'zod';

export const workspaceDtoSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80),
});

export type WorkspaceDto = z.infer<typeof workspaceDtoSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
