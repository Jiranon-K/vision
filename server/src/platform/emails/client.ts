import { Resend } from 'resend';
import { logger } from '../logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not set — email sending will fail');
}

export const resend = new Resend(RESEND_API_KEY || 'missing-key');

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Vision';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Characters that would end a quoted display name or the header line itself.
const UNSAFE_IN_DISPLAY_NAME = /["\\<>\r\n]/g;

export function formatFromAddress(name = EMAIL_FROM_NAME): string {
  // A display name may carry a Creator's own text, so it is quoted and
  // stripped of anything that could break out of the quotes.
  return `"${name.replace(UNSAFE_IN_DISPLAY_NAME, '')}" <${EMAIL_FROM}>`;
}
