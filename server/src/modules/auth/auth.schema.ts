import { z } from 'zod';

// Shared with the Creators module, whose password change applies the same rule.
export const passwordSchema = z
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
