import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim().length === 0 ? undefined : value;

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

const optionalText = (schema: z.ZodTypeAny) => z.preprocess(emptyStringToUndefined, schema.nullish());

const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((slug) => /[a-z0-9]/.test(slug), 'Slug must include at least one letter or number');

export const authRegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: requiredText('Name').max(120),
});

export const authLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createWorkspaceSchema = z.object({
  name: requiredText('Workspace name').max(120),
});

export const updateWorkspaceSchema = z
  .object({
    name: optionalText(requiredText('Workspace name').max(120)),
    slug: optionalText(slugSchema),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: 'At least one field (name or slug) must be provided',
  });

export const createBoardSchema = z.object({
  name: requiredText('Board name').max(120),
  description: optionalText(z.string().trim().max(500, 'Description must be at most 500 characters')),
});

export const updateBoardSchema = z
  .object({
    name: optionalText(requiredText('Board name').max(120)),
    slug: optionalText(slugSchema),
    description: optionalText(z.string().trim().max(500, 'Description must be at most 500 characters')),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided',
  });

export const createPostSchema = z.object({
  title: requiredText('Title').max(120),
  body: requiredText('Body'),
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE']),
});

export const createCommentSchema = z.object({
  body: requiredText('Comment body').max(500, 'Comment must be at most 500 characters'),
});
