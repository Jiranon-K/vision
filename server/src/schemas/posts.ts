import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt is too long'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tag: z.string().min(1, 'Tag is required'),
  status: z.enum(['Published', 'Draft', 'Scheduled']),
  readTime: z.string().min(1, 'Read time is required'),
  featured: z.boolean().optional(),
});

export const updatePostSchema = postSchema.partial();
