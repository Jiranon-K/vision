# Auth Email Flow — Design Spec

**Date:** 2026-05-24
**Branch:** `feat/auth-email-flow`
**Status:** Approved, ready for implementation plan

---

## Goal

Complete the broken auth flow in Vision:

1. Build missing frontend pages: `/forgot-password`, `/reset-password`, `/verify-email`
2. Replace `console.log` token leaks with real email sending via Resend
3. Fix existing bugs in token storage (plain vs hashed mismatch)
4. Add unverified-email banner in dashboard with resend action

## Non-Goals

- 2FA / TOTP setup
- Social auth providers (Google, GitHub)
- Email change flow (already disabled by design — out of scope)
- Account deletion flow
- Replacing the existing JWT cookie strategy

---

## Architecture

### Backend additions

```
server/src/
  emails/
    client.ts                        # Resend SDK init from env
    templates/
      ResetPasswordEmail.tsx         # react-email component
      VerifyEmail.tsx                # react-email component
    send.ts                          # sendResetPasswordEmail, sendVerificationEmail
  controllers/auth.controller.ts     # MODIFIED — wire email sender, fix token bugs
  routes/auth.ts                     # ADD POST /resend-verification
  middleware/authRateLimit.ts        # MODIFIED — add limiter for forgot/resend
```

### Frontend additions

```
app/
  forgot-password/page.tsx           # Email input form
  reset-password/page.tsx            # Token from query, new password form
  verify-email/page.tsx              # Auto-POST token on mount, success/error states

components/
  dashboard/
    UnverifiedEmailBanner.tsx        # Shows when user.emailVerified === false
```

### Dependencies

**Backend (`server/package.json`):**
- `resend` — official Resend SDK
- `react-email` + `@react-email/components` — email templating
- `react` + `react-dom` — peer deps of react-email (already in monorepo root, server needs explicit add)

**Frontend:** no new deps.

---

## Data flow

### Forgot password

1. User submits email at `/forgot-password` → `POST /api/auth/forgot-password { email }`
2. Server generates `crypto.randomBytes(32).toString('hex')` plain token
3. Server stores `hashToken(plain)` (SHA-256) + 1h expiry on user document
4. Server calls `sendResetPasswordEmail(email, plainToken)`
5. Email contains link: `${FRONTEND_URL}/reset-password?token=<plainToken>`
6. Server returns `200` always (no email enumeration)
7. User clicks link → page reads `?token=` from query, shows password form
8. User submits → `POST /api/auth/reset-password { token, newPassword }`
9. Server hashes incoming token, finds user by `resetPasswordToken: hashedToken` with non-expired `resetPasswordExpiry`
10. Updates password, clears reset token + expiry, clears refresh token (force re-login)
11. Frontend redirects to `/login` with success flash

### Email verification

1. Register → server generates plain verification token, stores hash, sends email
2. Email link: `${FRONTEND_URL}/verify-email?token=<plainToken>`
3. Page reads token from query, auto-POSTs to `/api/auth/verify-email { token }` on mount
4. Server hashes, matches, sets `emailVerified: true`, clears `verificationToken`
5. Page shows success → "Continue to dashboard" button

### Resend verification

1. Dashboard banner button → `POST /api/auth/resend-verification` (JWT-protected)
2. Server generates new plain token, hashes, stores, sends email
3. Toast: "Verification email sent"

### Unverified banner

- Dashboard layout reads `user.emailVerified` from `useAuth` hook (already exists)
- If `false`: render `<UnverifiedEmailBanner />` at top with "Resend email" button
- Dismissible per-session (sessionStorage flag)

---

## Bugs fixed in scope

| File | Line | Bug | Fix |
|------|------|-----|-----|
| `server/src/controllers/auth.controller.ts` | 295 | `forgotPassword` stores plain token, but `resetPassword` queries by hash → flow broken | Store `hashToken(resetToken)` instead of `resetToken` |
| `server/src/controllers/auth.controller.ts` | 100 | Register URL log uses `/verify` not `/verify-email` | Use correct path via email sender |
| `server/src/controllers/auth.controller.ts` | 88-94 | Register stores plain verification token, `verifyEmail` (line 362) queries plain — inconsistent with reset flow | Store hashed token, hash incoming on verify |
| `server/src/controllers/auth.controller.ts` | 100, 300 | Tokens logged to console (leak risk if logs shipped) | Remove logs, send via Resend |

---

## Security

- **Token storage:** all tokens (reset + verification) stored as SHA-256 hash via existing `hashToken()` util in `server/src/utils/token.ts`
- **Token expiry:** reset 1h (already set), verification 24h (new — add `verificationTokenExpiry` field to User model)
- **Single-use:** clear token field after successful use (already done for reset, ensure same for verify)
- **Rate limit (new):**
  - `POST /forgot-password`: 3 requests / hour / IP
  - `POST /resend-verification`: 3 requests / hour / authenticated user
  - Apply via `express-rate-limit` (already a dep)
- **No email enumeration:** `forgot-password` returns identical 200 regardless of email existence (already done — preserve)
- **Resend failures:** logged server-side, but `forgot-password` still returns 200 to user (don't leak)
- **Token in URL query:** acceptable for one-time tokens; mitigated by short expiry + single-use + HTTPS (referrer policy `no-referrer` on auth pages to prevent leak via Referer header)

---

## Email templates

Both via `react-email`:

### ResetPasswordEmail
- Subject: `Reset your Vision password`
- Body: greeting → "Click below to reset" CTA button → fallback plain URL → "Expires in 1 hour. Ignore if you didn't request."

### VerifyEmail
- Subject: `Verify your Vision email`
- Body: greeting → "Confirm your email" CTA button → fallback plain URL → "Expires in 24 hours."

Brand colors / fonts: match existing Vision landing page (Space Grotesk, primary color from Tailwind config).

---

## Schema changes

`server/src/models/User.ts`:

```typescript
// ADD field:
verificationTokenExpiry?: Date;
```

No migration needed — Mongoose handles missing field on existing docs gracefully (undefined → treated as no token).

---

## API contract

### `POST /api/auth/forgot-password`
- Body: `{ email: string }`
- Validation: existing `forgotPasswordSchema`
- Response: `200 { message: string }` always
- Rate-limited

### `POST /api/auth/reset-password`
- Body: `{ token: string, newPassword: string }`
- Validation: existing `resetPasswordSchema`
- Response: `200 { message }` | `400 { error }` if expired/invalid

### `POST /api/auth/verify-email`
- Body: `{ token: string }`
- Response: `200 { message }` | `400 { error }` if invalid/expired

### `POST /api/auth/resend-verification` (new)
- Auth: JWT required
- Body: none (uses authenticated user's email)
- Response: `200 { message }` always
- Rate-limited
- 400 if user already verified

---

## Environment variables (new)

```
# server/.env
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Vision
FRONTEND_URL=http://localhost:3000   # already exists, ensure consistent usage
```

Document in `.env.example` (also create as part of `.env.example` debt — but only `server/.env.example` here, full one is separate work).

---

## Error handling

| Scenario | UX |
|----------|-----|
| Forgot-password rate limited | Toast: "Too many requests, try again in an hour" |
| Reset token invalid/expired | Page state: "This link has expired. [Request new link]" |
| Verify token invalid/expired | Page state: "Invalid or expired. [Resend verification]" |
| Resend API failure | Toast on resend-verification: "Couldn't send, try again later". On register/forgot-password: server logs only, user sees generic success |
| Network error on form submit | Inline error: "Connection issue, try again" |

---

## Testing

### Unit
- `hashToken()` reversibility check (deterministic for same input)
- Email template render snapshots
- Token expiry boundary (just before / just after)

### Integration (backend)
- Full forgot → reset flow with mocked `resend.emails.send`
- Verify flow with mocked Resend
- Resend rate limit triggers after 3 calls
- Expired reset token returns 400

### Manual
- Send real email to dev address via Resend test mode
- Click email link in mail client → land on correct page
- Verify mobile email rendering (react-email preview server)

---

## Rollout

1. Local dev: Resend API key in `server/.env`, test full flow with personal email
2. Staging: separate Resend project, verify domain DNS (SPF/DKIM)
3. Prod: production Resend project with production-verified sending domain

---

## Open questions (resolved)

| Question | Decision |
|----------|----------|
| Email provider | Resend |
| Verify enforcement | Optional — banner warn only, no login block |
| Token storage | SHA-256 hash for all |
| Email template | react-email |
| Branch | `feat/auth-email-flow` (single branch, all work) |

---

## Out of scope (follow-up)

- `.env.example` for frontend + full project (separate ticket)
- Email change flow
- Account deletion
- 2FA
- Magic-link login
- Webhook for Resend bounce / complaint handling
