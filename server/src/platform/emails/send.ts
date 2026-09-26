import { resend, formatFromAddress, FRONTEND_URL } from './client';
import { ResetPasswordEmail } from './templates/reset-password-email';
import { VerifyEmail } from './templates/verify-email';
import { FollowConfirmationEmailTemplate } from './templates/follow-confirmation-email';
import { DeliveryEmailTemplate } from './templates/delivery-email';

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

// Follower email is sent in the Creator's name, from Vision's address: the
// relationship is between the Creator and their Follower (ADR 0009).
function fromCreator(creatorName: string): string {
  return formatFromAddress(`${creatorName} via Vision`);
}

export interface FollowConfirmationEmail {
  to: string;
  creatorName: string;
  confirmUrl: string;
}

export async function sendFollowConfirmationEmail({
  to,
  creatorName,
  confirmUrl,
}: FollowConfirmationEmail): Promise<void> {
  const { error } = await resend.emails.send({
    from: fromCreator(creatorName),
    to,
    subject: `Confirm you want ${creatorName}'s new Posts`,
    react: FollowConfirmationEmailTemplate({ creatorName, confirmUrl }),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

export interface DeliveryEmail {
  to: string;
  replyTo?: string;
  creatorName: string;
  byline?: string;
  title: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  readUrl: string;
  stopUrl: string;
  /** RFC 8058 one-click endpoint a mail client may POST to. */
  oneClickStopUrl: string;
}

export async function sendDeliveryEmail(email: DeliveryEmail): Promise<void> {
  const { error } = await resend.emails.send({
    from: fromCreator(email.creatorName),
    to: email.to,
    replyTo: email.replyTo,
    subject: email.title,
    headers: {
      'List-Unsubscribe': `<${email.oneClickStopUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    react: DeliveryEmailTemplate(email),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
