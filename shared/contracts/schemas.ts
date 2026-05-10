import { z } from 'zod';

export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional().nullable(),
});

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
});

export const createBoardSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).optional().nullable(),
});

export const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE']),
});
