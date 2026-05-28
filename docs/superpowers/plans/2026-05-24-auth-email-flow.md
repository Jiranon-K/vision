# Auth Email Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Vision's auth flow — build forgot/reset/verify pages, replace `console.log` token leaks with Resend-sent emails, fix existing token-hashing bugs, and surface an unverified-email banner in the dashboard.

**Architecture:** Backend gains an `emails/` module (Resend client + react-email templates + send functions) and a small set of controller patches that hash tokens consistently before storing/querying. Frontend gains three public pages and a dashboard banner. Token verification flows return user to login with a flash message.

**Tech Stack:** Express 5 + Mongoose, Next.js 16 App Router, React 19, Resend SDK, react-email, zod, vitest (newly added for backend tests), express-rate-limit.

---

## File Structure

### Backend — `server/`

| File | Type | Responsibility |
|------|------|----------------|
| `package.json` | modify | Add `resend`, `react-email`, `@react-email/components`, `react`, `react-dom`, `vitest`, `supertest`, `mongodb-memory-server` |
| `vitest.config.ts` | create | Minimal vitest config |
| `tsconfig.json` | modify | Enable `jsx: "react-jsx"` for email templates |
| `.env.example` | create | Document required env vars |
| `src/models/User.ts` | modify | Add `verificationTokenExpiry?: Date` field |
| `src/schemas/auth.ts` | modify | Add `verifyEmailSchema` |
| `src/emails/client.ts` | create | Initialise Resend client from env |
| `src/emails/templates/ResetPasswordEmail.tsx` | create | react-email template |
| `src/emails/templates/VerifyEmail.tsx` | create | react-email template |
| `src/emails/send.ts` | create | `sendResetPasswordEmail`, `sendVerificationEmail` |
| `src/controllers/auth.controller.ts` | modify | Fix token-hash bugs, wire email sender, add `resendVerification` |
| `src/routes/auth.ts` | modify | Add `POST /resend-verification` |
| `src/config/rateLimit.ts` | modify | Tighten `forgotPasswordLimiter` to 3/hr, add `resendVerificationLimiter` |
| `tests/utils/token.test.ts` | create | Unit tests for `hashToken` |
| `tests/emails/send.test.ts` | create | Unit tests for `sendResetPasswordEmail` / `sendVerificationEmail` (mocked Resend) |
| `tests/integration/auth-email-flow.test.ts` | create | Integration: forgot→reset, register→verify, resend-verification |

### Frontend — repo root

| File | Type | Responsibility |
|------|------|----------------|
| `app/forgot-password/page.tsx` | create | Email input → POST `/api/auth/forgot-password` |
| `app/reset-password/page.tsx` | create | Read `?token=`, password form → POST `/api/auth/reset-password` |
| `app/verify-email/page.tsx` | create | Auto-POST token on mount, success/error UI |
| `components/dashboard/UnverifiedEmailBanner.tsx` | create | Banner with resend button + sessionStorage dismiss |
| `app/dashboard/layout.tsx` | modify | Render banner when `user.emailVerified === false` |
| `hooks/useAuth.ts` | modify | Additionally return `user` from `/api/auth/me` |
| `lib/api.ts` | modify | Add `forgotPasswordRequest`, `resetPasswordRequest`, `verifyEmailRequest`, `resendVerificationRequest` |

---

## Task 1: Install backend dependencies and configure JSX

**Files:**
- Modify: `server/package.json`
- Modify: `server/tsconfig.json`

- [ ] **Step 1: Install runtime + dev deps**

Run (from `server/` directory):
```bash
cd server
bun add resend react react-dom @react-email/components react-email
bun add -d vitest supertest mongodb-memory-server @types/supertest @types/react @types/react-dom
```

Expected: `package.json` updates, `bun.lock` regenerates.

- [ ] **Step 2: Enable JSX in `server/tsconfig.json`**

Find the `compilerOptions` block and ensure these keys exist (add if missing):
```json
"jsx": "react-jsx",
"esModuleInterop": true,
"moduleResolution": "node",
"resolveJsonModule": true,
```

- [ ] **Step 3: Verify build still passes**

Run:
```bash
cd server && bun run build
```
Expected: clean exit, `dist/` produced.

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/bun.lock server/tsconfig.json
git commit -m "chore(server): add resend, react-email, and vitest deps"
```

---

## Task 2: Create vitest config

**Files:**
- Create: `server/vitest.config.ts`
- Modify: `server/package.json` (add test scripts)

- [ ] **Step 1: Write `server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
  esbuild: {
    jsx: 'automatic',
  },
});
```

- [ ] **Step 2: Add test scripts to `server/package.json`**

In the `scripts` object, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Sanity check — run vitest with no tests**

Run:
```bash
cd server && bun run test
```
Expected: `No test files found` (acceptable — config valid).

- [ ] **Step 4: Commit**

```bash
git add server/vitest.config.ts server/package.json
git commit -m "chore(server): configure vitest with node environment and jsx support"
```

---

## Task 3: Add verificationTokenExpiry to User model

**Files:**
- Modify: `server/src/models/User.ts`

- [ ] **Step 1: Add field to `IUser` interface**

In `server/src/models/User.ts`, inside the `IUser` interface, add after `verificationToken?: string;`:
```typescript
verificationTokenExpiry?: Date;
```

- [ ] **Step 2: Add field to `UserSchema`**

In the `UserSchema` definition, after the `verificationToken` line, add:
```typescript
verificationTokenExpiry: { type: Date },
```

- [ ] **Step 3: Verify type-check passes**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/User.ts
git commit -m "feat(auth): add verificationTokenExpiry field to User model"
```

---

## Task 4: Add verifyEmailSchema

**Files:**
- Modify: `server/src/schemas/auth.ts`

- [ ] **Step 1: Append schema after `resetPasswordSchema`**

In `server/src/schemas/auth.ts`, add after `resetPasswordSchema`:
```typescript
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/schemas/auth.ts
git commit -m "feat(auth): add verifyEmailSchema for token validation"
```

---

## Task 5: Write tests for hashToken utility

**Files:**
- Create: `server/tests/utils/token.test.ts`

- [ ] **Step 1: Write failing tests**

Create `server/tests/utils/token.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { hashToken } from '../../src/utils/token';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

describe('hashToken', () => {
  it('produces deterministic output for the same input', () => {
    const token = 'abc123';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces different output for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('produces a 64-char hex string (SHA-256)', () => {
    const result = hashToken('any-input');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (function already exists)**

Run:
```bash
cd server && bun run test tests/utils/token.test.ts
```
Expected: 3 passing.

- [ ] **Step 3: Commit**

```bash
git add server/tests/utils/token.test.ts
git commit -m "test(auth): add unit tests for hashToken determinism"
```

---

## Task 6: Create Resend client module

**Files:**
- Create: `server/src/emails/client.ts`

- [ ] **Step 1: Write client module**

Create `server/src/emails/client.ts`:
```typescript
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
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/emails/client.ts
git commit -m "feat(emails): add Resend client module with env-based config"
```

---

## Task 7: Create ResetPasswordEmail template

**Files:**
- Create: `server/src/emails/templates/ResetPasswordEmail.tsx`

- [ ] **Step 1: Write template**

Create `server/src/emails/templates/ResetPasswordEmail.tsx`:
```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  resetUrl: string;
  recipientName?: string;
}

export function ResetPasswordEmail({ resetUrl, recipientName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Vision password</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px', margin: '0 auto', border: '3px solid #000' }}>
          <Heading style={{ color: '#111', fontSize: '24px', margin: '0 0 16px' }}>
            Reset your password
          </Heading>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Hi {recipientName || 'there'},
          </Text>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            We received a request to reset the password for your Vision account.
            Click the button below to choose a new password.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: '#D4FF3F',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '0',
                border: '3px solid #000',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Or paste this link into your browser:
            <br />
            <a href={resetUrl} style={{ color: '#0066cc' }}>{resetUrl}</a>
          </Text>
          <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
            This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/emails/templates/ResetPasswordEmail.tsx
git commit -m "feat(emails): add ResetPasswordEmail react-email template"
```

---

## Task 8: Create VerifyEmail template

**Files:**
- Create: `server/src/emails/templates/VerifyEmail.tsx`

- [ ] **Step 1: Write template**

Create `server/src/emails/templates/VerifyEmail.tsx`:
```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerifyEmailProps {
  verifyUrl: string;
  recipientName?: string;
}

export function VerifyEmail({ verifyUrl, recipientName }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Vision email</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px', margin: '0 auto', border: '3px solid #000' }}>
          <Heading style={{ color: '#111', fontSize: '24px', margin: '0 0 16px' }}>
            Confirm your email
          </Heading>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Hi {recipientName || 'there'},
          </Text>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Welcome to Vision! Please confirm your email address by clicking the button below.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={verifyUrl}
              style={{
                backgroundColor: '#D4FF3F',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '0',
                border: '3px solid #000',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Verify email
            </Button>
          </Section>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Or paste this link into your browser:
            <br />
            <a href={verifyUrl} style={{ color: '#0066cc' }}>{verifyUrl}</a>
          </Text>
          <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
            This link expires in 24 hours.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmail;
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/emails/templates/VerifyEmail.tsx
git commit -m "feat(emails): add VerifyEmail react-email template"
```

---

## Task 9: Write failing tests for send functions

**Files:**
- Create: `server/tests/emails/send.test.ts`

- [ ] **Step 1: Write failing tests**

Create `server/tests/emails/send.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.FRONTEND_URL = 'http://test.local';
});

const mockSend = vi.fn();
vi.mock('../../src/emails/client', async () => {
  return {
    resend: { emails: { send: mockSend } },
    EMAIL_FROM: 'noreply@test.local',
    EMAIL_FROM_NAME: 'Vision Test',
    FRONTEND_URL: 'http://test.local',
    formatFromAddress: () => 'Vision Test <noreply@test.local>',
  };
});

import { sendResetPasswordEmail, sendVerificationEmail } from '../../src/emails/send';

describe('sendResetPasswordEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  it('sends to the correct address with the reset URL', async () => {
    await sendResetPasswordEmail('user@test.local', 'plain-token-123', 'Alice');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toBe('user@test.local');
    expect(callArg.subject).toMatch(/reset/i);
    expect(callArg.from).toBe('Vision Test <noreply@test.local>');
    expect(callArg.react).toBeDefined();
  });

  it('throws when Resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'API error' } });
    await expect(
      sendResetPasswordEmail('user@test.local', 'tok', 'Alice')
    ).rejects.toThrow(/API error/);
  });
});

describe('sendVerificationEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'msg-2' }, error: null });
  });

  it('sends to the correct address with the verify URL', async () => {
    await sendVerificationEmail('new@test.local', 'verify-token-abc', 'Bob');

    expect(mockSend).toHaveBeenCalledTimes(1);
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.to).toBe('new@test.local');
    expect(callArg.subject).toMatch(/verify/i);
    expect(callArg.react).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd server && bun run test tests/emails/send.test.ts
```
Expected: FAIL with "Cannot find module '../../src/emails/send'".

- [ ] **Step 3: Implement `server/src/emails/send.ts`**

Create `server/src/emails/send.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd server && bun run test tests/emails/send.test.ts
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add server/src/emails/send.ts server/tests/emails/send.test.ts
git commit -m "feat(emails): add sendResetPasswordEmail and sendVerificationEmail"
```

---

## Task 10: Fix forgotPassword controller — hash token before storing, send email

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`

- [ ] **Step 1: Add import for send function**

At the top of `server/src/controllers/auth.controller.ts`, add to existing imports:
```typescript
import { sendResetPasswordEmail, sendVerificationEmail } from '../emails/send';
```

- [ ] **Step 2: Replace `forgotPassword` body — hash token, send email**

Replace the lines that read (currently lines ~291-302):
```typescript
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save();


    console.log(`[PASSWORD RESET] For ${email}: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
```

With:
```typescript
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    try {
      await sendResetPasswordEmail(user.email, resetToken, user.profile?.name);
    } catch (sendErr) {
      console.error('Failed to send reset email:', sendErr);
      // Intentionally do NOT reveal send failure to client (no enumeration)
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
```

- [ ] **Step 3: Verify `hashToken` is already imported**

Confirm the existing import line at the top reads:
```typescript
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken } from '../utils/token';
```
(It already is — no change needed if present.)

- [ ] **Step 4: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/auth.controller.ts
git commit -m "fix(auth): hash reset token before storing and send via Resend

Previously the controller stored the plain reset token but the reset
endpoint queried by hash, breaking the flow entirely. Now both sides
use hashToken consistently. Replaces console.log with real email send."
```

---

## Task 11: Fix register controller — hash verification token, set expiry, send email

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`

- [ ] **Step 1: Replace verification token generation in `register`**

Find the block that reads (currently lines ~87-100):
```typescript
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email,
      password,
      profile: { name: name || '' },
      verificationToken,
    });

    await user.save();


    console.log(`[EMAIL VERIFICATION] For ${email}: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`);
```

Replace with:
```typescript
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      email,
      password,
      profile: { name: name || '' },
      verificationToken: hashToken(verificationToken),
      verificationTokenExpiry,
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.name);
    } catch (sendErr) {
      console.error('Failed to send verification email:', sendErr);
      // Registration still succeeds; user can request resend later
    }
```

- [ ] **Step 2: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/auth.controller.ts
git commit -m "fix(auth): hash verification token, add 24h expiry, send via Resend

Aligns verification token storage with reset token (hashed at rest).
Adds verificationTokenExpiry so verify endpoint can reject stale tokens."
```

---

## Task 12: Fix verifyEmail controller — hash incoming token, check expiry

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`

- [ ] **Step 1: Add import for the schema**

At the top of `server/src/controllers/auth.controller.ts`, extend the existing schema import:
```typescript
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth';
```

- [ ] **Step 2: Replace `verifyEmail` body**

Replace the entire `verifyEmail` function (currently lines ~357-379) with:
```typescript
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { token } = validation.data;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
```

- [ ] **Step 3: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/auth.controller.ts
git commit -m "fix(auth): hash incoming verify token and check expiry"
```

---

## Task 13: Add resendVerification controller

**Files:**
- Modify: `server/src/controllers/auth.controller.ts`

- [ ] **Step 1: Append new export at end of file**

At the end of `server/src/controllers/auth.controller.ts`, append:
```typescript
export const resendVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = hashToken(verificationToken);
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.name);
    } catch (sendErr) {
      console.error('Failed to send verification email:', sendErr);
      res.status(500).json({ error: 'Could not send verification email. Please try again later.' });
      return;
    }

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
```

- [ ] **Step 2: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/auth.controller.ts
git commit -m "feat(auth): add resendVerification controller for logged-in users"
```

---

## Task 14: Tighten forgotPasswordLimiter and add resendVerificationLimiter

**Files:**
- Modify: `server/src/config/rateLimit.ts`

- [ ] **Step 1: Lower `forgotPasswordLimiter.max` from 5 to 3**

In `server/src/config/rateLimit.ts`, locate `forgotPasswordLimiter` and change:
```typescript
  max: 5,
```
to:
```typescript
  max: 3,
```

- [ ] **Step 2: Append `resendVerificationLimiter` to the same file**

At the end of `server/src/config/rateLimit.ts`, append:
```typescript

export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many verification email requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req) => {
    const user = (req as { user?: { id?: string } }).user;
    return `${req.ip}-${user?.id || 'anon'}`;
  },
});
```

- [ ] **Step 3: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/config/rateLimit.ts
git commit -m "feat(auth): tighten forgot-password limit to 3/hr and add resend-verification limiter"
```

---

## Task 15: Wire resend-verification route

**Files:**
- Modify: `server/src/routes/auth.ts`

- [ ] **Step 1: Extend imports**

At the top of `server/src/routes/auth.ts`, extend the controller import:
```typescript
import {
  register,
  login,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller';
```

And extend the rate-limit import:
```typescript
import { loginLimiter, registerLimiter, forgotPasswordLimiter, resendVerificationLimiter } from '../config/rateLimit';
```

- [ ] **Step 2: Append route registration**

After the `router.post('/verify-email', verifyEmail);` line, append:
```typescript
router.post('/resend-verification', auth, resendVerificationLimiter, resendVerification);
```

- [ ] **Step 3: Type-check**

Run:
```bash
cd server && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/auth.ts
git commit -m "feat(auth): add POST /api/auth/resend-verification route"
```

---

## Task 16: Add .env.example for server

**Files:**
- Create: `server/.env.example`

- [ ] **Step 1: Write the example file**

Create `server/.env.example`:
```
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/vision

# JWT
JWT_SECRET=replace-me-with-32+-char-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REMEMBER_ME_EXPIRES_IN=30d

# HTTP
PORT=3001
NODE_ENV=development

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3000

# Resend email provider
# Get an API key from https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Vision
```

- [ ] **Step 2: Commit**

```bash
git add server/.env.example
git commit -m "docs(server): add .env.example documenting required env vars"
```

---

## Task 17: Integration test — full forgot/reset flow

**Files:**
- Create: `server/tests/integration/auth-email-flow.test.ts`
- Modify: `server/src/index.ts` (only if app is not currently exported; see Step 1)

- [ ] **Step 1: Ensure Express app is exported separately from the listener**

Open `server/src/index.ts`. If `app` is not exported, refactor so the `app.listen(...)` call lives at the bottom and the app instance is `export default app` (or `export const app`). Example shape:
```typescript
// existing imports + middleware + routes...

export const app = expressInstance;

if (require.main === module) {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}
```
If already exported, skip.

- [ ] **Step 2: Write the integration test**

Create `server/tests/integration/auth-email-flow.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.JWT_SECRET = 'integration-test-secret';
process.env.RESEND_API_KEY = 'test-key';
process.env.FRONTEND_URL = 'http://test.local';
process.env.EMAIL_FROM = 'noreply@test.local';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'msg' }, error: null });
vi.mock('../../src/emails/client', () => ({
  resend: { emails: { send: sendMock } },
  EMAIL_FROM: 'noreply@test.local',
  EMAIL_FROM_NAME: 'Vision Test',
  FRONTEND_URL: 'http://test.local',
  formatFromAddress: () => 'Vision Test <noreply@test.local>',
}));

let mongo: MongoMemoryServer;
let app: import('express').Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  const mod = await import('../../src/index');
  app = mod.app;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  sendMock.mockClear();
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
});

const validPassword = 'Aa1!aaaa';

async function registerUser(email = 'test@test.local') {
  return request(app)
    .post('/api/auth/register')
    .send({ email, password: validPassword, name: 'Test User' });
}

describe('Forgot → Reset flow', () => {
  it('completes successfully end-to-end', async () => {
    await registerUser('reset@test.local');
    sendMock.mockClear();

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.local' });
    expect(forgotRes.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);

    // Extract plain token from the captured send call
    const sendArg = sendMock.mock.calls[0][0];
    const renderedProps = (sendArg.react as { props: { resetUrl: string } }).props;
    const url = new URL(renderedProps.resetUrl);
    const token = url.searchParams.get('token')!;
    expect(token).toBeTruthy();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'Bb2@bbbb' });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.local', password: 'Bb2@bbbb' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects expired reset token', async () => {
    await registerUser('expire@test.local');
    sendMock.mockClear();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'expire@test.local' });

    const sendArg = sendMock.mock.calls[0][0];
    const token = new URL((sendArg.react as { props: { resetUrl: string } }).props.resetUrl).searchParams.get('token')!;

    // Force expiry in the DB
    const User = (await import('../../src/models/User')).default;
    await User.updateOne(
      { email: 'expire@test.local' },
      { resetPasswordExpiry: new Date(Date.now() - 1000) }
    );

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'Bb2@bbbb' });
    expect(resetRes.status).toBe(400);
  });

  it('returns 200 even for unknown email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'never-registered@test.local' });
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test**

Run:
```bash
cd server && bun run test tests/integration/auth-email-flow.test.ts
```
Expected: 3 passing.

- [ ] **Step 4: Commit**

```bash
git add server/tests/integration/auth-email-flow.test.ts server/src/index.ts
git commit -m "test(auth): integration coverage for forgot/reset flow"
```

---

## Task 18: Integration test — verify + resend flow

**Files:**
- Modify: `server/tests/integration/auth-email-flow.test.ts` (append cases)

- [ ] **Step 1: Append verify/resend test cases**

At the end of `server/tests/integration/auth-email-flow.test.ts`, append:
```typescript
describe('Register → Verify flow', () => {
  it('verifies email when token matches', async () => {
    sendMock.mockClear();
    await registerUser('verify@test.local');
    expect(sendMock).toHaveBeenCalledTimes(1);

    const sendArg = sendMock.mock.calls[0][0];
    const token = new URL((sendArg.react as { props: { verifyUrl: string } }).props.verifyUrl).searchParams.get('token')!;

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token });
    expect(res.status).toBe(200);

    const User = (await import('../../src/models/User')).default;
    const user = await User.findOne({ email: 'verify@test.local' });
    expect(user?.emailVerified).toBe(true);
  });

  it('rejects invalid verify token', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'bogus-token' });
    expect(res.status).toBe(400);
  });
});

describe('Resend verification flow', () => {
  it('sends a new verification email for an authenticated unverified user', async () => {
    sendMock.mockClear();
    const reg = await registerUser('resend@test.local');
    const cookies = reg.headers['set-cookie'];
    expect(cookies).toBeTruthy();
    sendMock.mockClear();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Cookie', cookies as unknown as string[])
      .send({});
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when user already verified', async () => {
    const reg = await registerUser('alreadyverified@test.local');
    const cookies = reg.headers['set-cookie'];

    const User = (await import('../../src/models/User')).default;
    await User.updateOne(
      { email: 'alreadyverified@test.local' },
      { emailVerified: true, verificationToken: undefined, verificationTokenExpiry: undefined }
    );

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Cookie', cookies as unknown as string[])
      .send({});
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run all integration tests**

Run:
```bash
cd server && bun run test tests/integration/auth-email-flow.test.ts
```
Expected: 7 passing (3 from Task 17 + 4 new).

- [ ] **Step 3: Commit**

```bash
git add server/tests/integration/auth-email-flow.test.ts
git commit -m "test(auth): integration coverage for verify and resend-verification"
```

---

## Task 19: Extend useAuth hook to expose user data

**Files:**
- Modify: `hooks/useAuth.ts`
- Create: `lib/auth.ts` helper additions (see Step 2)

- [ ] **Step 1: Add `getCurrentUser` helper to `lib/auth.ts`**

Open `lib/auth.ts`. Append:
```typescript
export interface CurrentUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    name: string;
    bio?: string;
    avatar?: string;
  };
}

export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const { authFetch } = await import('@/lib/api');
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
};
```

- [ ] **Step 2: Update `hooks/useAuth.ts`**

Replace the entire file contents with:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

export function useAuth(redirectToLogin = true) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const currentUser = await getCurrentUser();
      if (!cancelled) {
        setUser(currentUser);
        setIsAuthed(!!currentUser);
        setIsLoading(false);
        if (!currentUser && redirectToLogin) {
          router.replace("/login");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, redirectToLogin]);

  return { isLoading, isAuthed, user };
}
```

- [ ] **Step 3: Verify existing dashboard pages still type-check**

Run:
```bash
bun run lint
```
Expected: no new errors (existing pages destructure `isLoading` and `isAuthed` only — adding `user` is additive).

- [ ] **Step 4: Commit**

```bash
git add hooks/useAuth.ts lib/auth.ts
git commit -m "feat(auth): expose user object from useAuth via getCurrentUser helper"
```

---

## Task 20: Add API helper functions for auth flows

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Append helper functions**

At the end of `lib/api.ts`, append:
```typescript

// Auth — public flows
export async function forgotPasswordRequest(email: string): Promise<Response> {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<Response> {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function verifyEmailRequest(token: string): Promise<Response> {
  return apiFetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationRequest(): Promise<Response> {
  return authFetch("/api/auth/resend-verification", {
    method: "POST",
  });
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
bun run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/api.ts
git commit -m "feat(api): add forgot/reset/verify/resend-verification client helpers"
```

---

## Task 21: Build /forgot-password page

**Files:**
- Create: `app/forgot-password/page.tsx`

- [ ] **Step 1: Write the page component**

Create `app/forgot-password/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPasswordRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      if (!res.ok && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Something went wrong");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#D4FF3F] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(#000 10%, transparent 10%)", backgroundSize: "30px 30px" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black text-brand-dark bg-white px-6 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] -rotate-2">
              VISION
            </h1>
          </Link>
        </div>

        <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
          {submitted ? (
            <>
              <h2 className="text-2xl font-black text-brand-dark mb-4">CHECK YOUR EMAIL</h2>
              <p className="text-brand-dark/80 font-bold text-sm">
                If an account exists for <span className="font-black">{email}</span>, a reset link is on its way. The link expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="block mt-6 w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
              >
                Back to login
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-brand-dark mb-6 underline decoration-cyan-400 decoration-4 underline-offset-4">
                FORGOT PASSWORD
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email"
                    className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-cyan-50 focus:shadow-[4px_4px_0px_0px_#22d3ee] font-bold"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit"
                  className="w-full py-4 bg-yellow-400 border-[3px] border-black font-black text-brand-dark text-xl shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
                >
                  {loading ? "SENDING..." : "SEND RESET LINK →"}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-black text-brand-dark hover:text-cyan-600 uppercase">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and visually verify**

Run in a separate terminal:
```bash
bun dev
```
Then open `http://localhost:3000/forgot-password`. Expected: page renders, submitting any email shows the success state.

- [ ] **Step 3: Commit**

```bash
git add app/forgot-password/page.tsx
git commit -m "feat(auth): add /forgot-password page"
```

---

## Task 22: Build /reset-password page

**Files:**
- Create: `app/reset-password/page.tsx`

- [ ] **Step 1: Write the page component**

Create `app/reset-password/page.tsx`:
```tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordRequest } from "@/lib/api";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
        <h2 className="text-2xl font-black text-brand-dark mb-4">MISSING TOKEN</h2>
        <p className="text-brand-dark/80 font-bold text-sm mb-6">
          This reset link is invalid. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          Request new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordRequest(token, password);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (data.details?.[0]?.message ?? "Reset failed"));
        return;
      }
      toast.success("Password reset successfully");
      router.replace("/login");
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
      <h2 className="text-2xl font-black text-brand-dark mb-6 underline decoration-cyan-400 decoration-4 underline-offset-4">
        SET NEW PASSWORD
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="reset-password"
            className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-cyan-50 focus:shadow-[4px_4px_0px_0px_#22d3ee] font-bold"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            data-testid="reset-confirm"
            className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-fuchsia-50 focus:shadow-[4px_4px_0px_0px_#d946ef] font-bold"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          data-testid="reset-submit"
          className="w-full py-4 bg-yellow-400 border-[3px] border-black font-black text-brand-dark text-xl shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          {loading ? "SAVING..." : "RESET PASSWORD →"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen bg-[#D4FF3F] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(#000 10%, transparent 10%)", backgroundSize: "30px 30px" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black text-brand-dark bg-white px-6 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] -rotate-2">
              VISION
            </h1>
          </Link>
        </div>
        <Suspense fallback={<div className="text-brand-dark font-black">Loading...</div>}>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Visually verify**

With dev server running, open `http://localhost:3000/reset-password?token=abc`. Expected: form renders. Open `http://localhost:3000/reset-password` (no token). Expected: missing-token state shown.

- [ ] **Step 3: Commit**

```bash
git add app/reset-password/page.tsx
git commit -m "feat(auth): add /reset-password page with token query handling"
```

---

## Task 23: Build /verify-email page

**Files:**
- Create: `app/verify-email/page.tsx`

- [ ] **Step 1: Write the page component**

Create `app/verify-email/page.tsx`:
```tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmailRequest } from "@/lib/api";

type State = "loading" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      setState("error");
      setErrorMsg("Missing verification token");
      return;
    }

    (async () => {
      try {
        const res = await verifyEmailRequest(token);
        const data = await res.json();
        if (res.ok) {
          setState("success");
        } else {
          setState("error");
          setErrorMsg(data.error || "Verification failed");
        }
      } catch {
        setState("error");
        setErrorMsg("Unable to reach server");
      }
    })();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
        <p className="text-brand-dark font-black uppercase">Verifying...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
        <h2 className="text-2xl font-black text-brand-dark mb-4">EMAIL VERIFIED ✓</h2>
        <p className="text-brand-dark/80 font-bold text-sm mb-6">
          Your email is confirmed. You can now access all features.
        </p>
        <Link
          href="/dashboard"
          className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
      <h2 className="text-2xl font-black text-brand-dark mb-4">VERIFICATION FAILED</h2>
      <p className="text-brand-dark/80 font-bold text-sm mb-6">{errorMsg}</p>
      <Link
        href="/dashboard"
        className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen bg-[#D4FF3F] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(#000 10%, transparent 10%)", backgroundSize: "30px 30px" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black text-brand-dark bg-white px-6 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] -rotate-2">
              VISION
            </h1>
          </Link>
        </div>
        <Suspense fallback={<div className="text-brand-dark font-black">Loading...</div>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Visually verify**

With dev server running, open `http://localhost:3000/verify-email?token=bogus`. Expected: shows error state with "Invalid or expired verification token".

- [ ] **Step 3: Commit**

```bash
git add app/verify-email/page.tsx
git commit -m "feat(auth): add /verify-email page that auto-submits token on mount"
```

---

## Task 24: Build UnverifiedEmailBanner component

**Files:**
- Create: `components/dashboard/UnverifiedEmailBanner.tsx`

- [ ] **Step 1: Write the component**

Create `components/dashboard/UnverifiedEmailBanner.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resendVerificationRequest } from "@/lib/api";

const DISMISS_KEY = "vision:unverified-banner-dismissed";

interface Props {
  userEmail: string;
}

export default function UnverifiedEmailBanner({ userEmail }: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const resend = async () => {
    setSending(true);
    try {
      const res = await resendVerificationRequest();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Verification email sent");
      } else {
        toast.error(data.error || "Could not send verification email");
      }
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setSending(false);
    }
  };

  if (dismissed) return null;

  return (
    <div
      data-testid="unverified-email-banner"
      className="bg-yellow-300 border-b-[3px] border-black px-6 py-3 flex items-center justify-between gap-4"
    >
      <p className="text-brand-dark font-bold text-sm">
        Your email <span className="font-black">{userEmail}</span> is not verified yet. Check your inbox for the verification link.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={resend}
          disabled={sending}
          className="px-3 py-1 bg-white border-[2px] border-black font-black text-brand-dark text-xs uppercase hover:shadow-[3px_3px_0px_0px_#000]"
        >
          {sending ? "SENDING..." : "RESEND"}
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="px-2 py-1 bg-white border-[2px] border-black font-black text-brand-dark text-xs uppercase hover:shadow-[3px_3px_0px_0px_#000]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/UnverifiedEmailBanner.tsx
git commit -m "feat(dashboard): add UnverifiedEmailBanner with resend and dismiss"
```

---

## Task 25: Wire banner into dashboard layout

**Files:**
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Replace layout with banner-aware version**

Note: dashboard layout currently is a server component. The banner needs client-side data (user state from `useAuth`). Wrap with a small client component that pulls `useAuth` and conditionally renders the banner.

Create `components/dashboard/DashboardHeader.tsx`:
```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import UnverifiedEmailBanner from "./UnverifiedEmailBanner";

export default function DashboardHeader() {
  const { user } = useAuth(false);
  if (!user || user.emailVerified) return null;
  return <UnverifiedEmailBanner userEmail={user.email} />;
}
```

- [ ] **Step 2: Update `app/dashboard/layout.tsx`**

Replace contents with:
```tsx
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-brand-gray">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Visually verify**

With dev server running:
- Login as a user where `emailVerified === false` (newly registered).
- Open `http://localhost:3000/dashboard`.
- Expected: yellow banner appears at top of main area; clicking "RESEND" shows toast; clicking "✕" hides it for the session.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx components/dashboard/DashboardHeader.tsx
git commit -m "feat(dashboard): show UnverifiedEmailBanner when user.emailVerified is false"
```

---

## Task 26: Manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Start backend and frontend**

In two terminals:
```bash
# Terminal 1
cd server && bun dev

# Terminal 2
bun dev
```

- [ ] **Step 2: Run the backend test suite one more time**

```bash
cd server && bun run test
```
Expected: all tests pass (9 unit + integration).

- [ ] **Step 3: Walk through full forgot-password flow with real Resend test mode**

(Requires real `RESEND_API_KEY` in `server/.env`.)
1. Register a new account at `/register` using your own email.
2. Confirm verification email arrives; click link; land on `/verify-email`; see success state.
3. Log out, visit `/forgot-password`; submit your email.
4. Confirm reset email arrives; click link; land on `/reset-password?token=...`; submit a new password.
5. Confirm redirect to `/login`; log in with the new password.

- [ ] **Step 4: Confirm rate limits**

Hit `/api/auth/forgot-password` 4 times with the same email within an hour. Expected: 4th request returns 429 with the limiter message.

- [ ] **Step 5: Commit a CHANGELOG entry (optional)**

If the project tracks `CHANGELOG.md`, append an entry. Otherwise skip.

---

## Task 27: Open pull request

**Files:** none

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/auth-email-flow
```

- [ ] **Step 2: Open PR via gh CLI**

```bash
gh pr create --title "feat(auth): complete forgot/reset/verify flow with Resend emails" --body "$(cat <<'EOF'
## Summary
- Builds `/forgot-password`, `/reset-password`, `/verify-email` pages
- Integrates Resend + react-email for transactional emails
- Adds `POST /api/auth/resend-verification` (rate-limited)
- Fixes pre-existing bug where reset/verification tokens were stored plain but queried by hash
- Adds dashboard `UnverifiedEmailBanner` with resend + dismiss
- Adds vitest + supertest backend test infra

## Testing
- 9 backend tests (unit + integration with mongodb-memory-server, mocked Resend)
- Manual end-to-end checked with real Resend test mode

## Setup
Copy `server/.env.example` to `server/.env` and set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review (completed)

**Spec coverage:**
- Forgot/reset pages → Tasks 21, 22 ✓
- Verify page → Task 23 ✓
- Resend Resend integration → Tasks 6, 7, 8, 9 ✓
- Token-hash bug fixes → Tasks 10, 11, 12 ✓
- `verificationTokenExpiry` field → Task 3 ✓
- Resend verification endpoint → Tasks 13, 15 ✓
- Rate limits (3/hr) → Task 14 ✓
- Unverified banner → Tasks 24, 25 ✓
- `.env.example` → Task 16 ✓
- Tests → Tasks 5, 9, 17, 18 ✓

**Placeholder scan:** clean — every code step contains the actual code.

**Type/name consistency:** `hashToken`, `sendResetPasswordEmail`, `sendVerificationEmail`, `resendVerification`, `forgotPasswordLimiter`, `resendVerificationLimiter`, `verificationTokenExpiry`, `useAuth` (returning `{ isLoading, isAuthed, user }`) — names match across all tasks.

**Scope:** single focused plan, ~27 tasks, no spec gaps.
