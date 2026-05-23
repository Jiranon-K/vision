import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn('[emails] RESEND_API_KEY not set — email sending will fail');
}

export const resend = new Resend(RESEND_API_KEY || 'missing-key');

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Vision';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export function formatFromAddress(): string {
  return `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`;
}
