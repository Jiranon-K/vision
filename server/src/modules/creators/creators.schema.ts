import { z } from 'zod';
import { passwordSchema } from '../auth';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).optional(),
  avatar: z.string().optional(),
  byline: z.string().trim().max(120, 'Byline is too long').optional(),
});

export const notificationSchema = z.object({
  notifications: z.object({
    email: z.object({
      newComments: z.boolean(),
      newFollowers: z.boolean(),
      weeklyDigest: z.boolean(),
      marketingEmails: z.boolean(),
    }),
    push: z.object({
      enabled: z.boolean(),
      postUpdates: z.boolean(),
      systemAlerts: z.boolean(),
    }),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
  }),
});
