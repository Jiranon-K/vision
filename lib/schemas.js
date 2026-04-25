"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");

const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((pwd) => /[A-Z]/.test(pwd), { message: 'Password must contain at least 1 uppercase letter' })
    .refine((pwd) => /[a-z]/.test(pwd), { message: 'Password must contain at least 1 lowercase letter' })
    .refine((pwd) => /[0-9]/.test(pwd), { message: 'Password must contain at least 1 number' })
    .refine((pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), { message: 'Password must contain at least 1 special character' });
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: passwordSchema,
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required'),
});
