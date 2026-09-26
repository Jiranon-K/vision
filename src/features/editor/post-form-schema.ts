import { z } from 'zod';

export const postFormSchema = z.object({
  title: z.string().min(1, 'กรุณาใส่หัวข้อ post').max(200, 'หัวข้อยาวเกินไป'),
  excerpt: z.string().max(500, 'Excerpt ยาวเกินไป').optional(),
  content: z.string().min(1, 'กรุณาใส่เนื้อหา'),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  status: z.enum(['Draft', 'Published']),
});

export type PostFormInput = z.infer<typeof postFormSchema>;
