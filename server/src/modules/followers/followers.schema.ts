import { z } from 'zod';

export const followSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post id'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .email('Enter an email address like name@example.com'),
});

export const tokenSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/, 'Invalid link'),
});
