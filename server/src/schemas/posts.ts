import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  // Optional: the server derives the excerpt from content when this is blank.
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['Published', 'Draft']),
  // readTime is computed server-side (Thai-aware) — not accepted from the client.
  featured: z.boolean().optional(),
  coverImage: z.string().optional(),
});

export const updatePostSchema = postSchema.partial();
