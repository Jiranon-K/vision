import { resend, formatFromAddress, FRONTEND_URL } from './client';
import { ResetPasswordEmail } from './templates/ResetPasswordEmail';
import { VerifyEmail } from './templates/VerifyEmail';

export async function sendResetPasswordEmail(
  to: string,
  plainToken: string,
  recipientName?: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(plainToken)}`;

  const { error } = await resend.emails.send({
    from: formatFromAddress(),
    to,
    subject: 'Reset your Vision password',
    react: ResetPasswordEmail({ resetUrl, recipientName }),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

export async function sendVerificationEmail(
  to: string,
  plainToken: string,
  recipientName?: string
): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(plainToken)}`;

  const { error } = await resend.emails.send({
    from: formatFromAddress(),
    to,
    subject: 'Verify your Vision email',
    react: VerifyEmail({ verifyUrl, recipientName }),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
