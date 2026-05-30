import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    { message: 'Password must contain at least 1 uppercase letter' }
  )
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    { message: 'Password must contain at least 1 lowercase letter' }
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    { message: 'Password must contain at least 1 number' }
  )
  .refine(
    (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    { message: 'Password must contain at least 1 special character' }
  );

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).optional(),
  avatar: z.string().optional(),
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
