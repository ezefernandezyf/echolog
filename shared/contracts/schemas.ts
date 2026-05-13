import { z } from 'zod';

export const authRegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional().nullable(),
});

export const authLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().min(1, 'Workspace name is required').optional(),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: 'At least one field (name or slug) must be provided',
  });

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional().nullable(),
});

export const updateBoardSchema = z
  .object({
    name: z.string().min(1, 'Board name is required').optional(),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    description: z.string().optional().nullable(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided',
  });

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE']),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
});
