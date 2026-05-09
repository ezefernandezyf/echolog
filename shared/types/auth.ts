import { z } from 'zod';

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(120).nullable().optional(),
});

export const registerAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

export const loginAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type UserDto = z.infer<typeof userDtoSchema>;
export type RegisterAuthInput = z.infer<typeof registerAuthSchema>;
export type LoginAuthInput = z.infer<typeof loginAuthSchema>;
