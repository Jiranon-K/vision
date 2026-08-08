import { test, expect, type Page } from '@playwright/test';
import { CREATOR } from './config';

// Evidence run: every auth screen and every state the redesign defines, captured
// as stills plus a video of the walk-through. Assertions are deliberately thin —
// the behaviour is covered in auth.spec.ts; this file exists to show the result.
test.use({ video: 'on' });

const SHOTS = 'test-results/auth-visual';

// AnimationProvider wipes a full-screen lime overlay across the viewport for
// 1.1s after every route change. Stills taken before it clears show the wipe,
// not the page.
const WIPE_MS = 1300;

async function shoot(page: Page, name: string) {
  await page.waitForTimeout(WIPE_MS);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test('every auth screen and state, desktop', async ({ page }) => {
  // Login — default, field validation, credential error
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await shoot(page, '01-login-default');

  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Check the highlighted fields below.')).toBeVisible();
  await shoot(page, '02-login-field-validation');

  await page.getByLabel('Email').fill(CREATOR.email);
  await page.getByLabel('Password').fill('WrongPassword1!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  await shoot(page, '03-login-credential-error');

  // Password visibility toggle
  await page.getByRole('button', { name: 'Show' }).click();
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'text');
  await shoot(page, '04-login-password-shown');

  // Register — empty, partial strength, full strength, field errors
  await page.goto('/register');
  await shoot(page, '05-register-default');

  await page.getByLabel('Password').fill('short');
  await shoot(page, '06-register-strength-weak');

  await page.getByLabel('Password').fill('E2ePass1!');
  await shoot(page, '07-register-strength-full');

  await page.getByLabel('Password').fill('weak');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Check the highlighted fields below.')).toBeVisible();
  await shoot(page, '08-register-field-validation');

  // Register — success panel, through a real registration
  await page.getByLabel('Full name').fill('Visual Evidence Creator');
  await page.getByLabel('Email').fill(`visual-${Date.now()}@e2e.local`);
  await page.getByLabel('Password').fill('E2ePass1!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible({
    timeout: 30_000,
  });
  await shoot(page, '09-register-success');

  // Login — success panel, using the Creator just created
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(CREATOR.email);
  await page.getByLabel('Password').fill(CREATOR.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Signed in' })).toBeVisible({
    timeout: 30_000,
  });
  await shoot(page, '10-login-success');
  await page.context().clearCookies();

  // Forgot password — form and the sent panel
  await page.goto('/forgot-password');
  await shoot(page, '11-forgot-default');
  await page.getByLabel('Email').fill(CREATOR.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({
    timeout: 30_000,
  });
  await shoot(page, '12-forgot-sent');

  // Reset password — the form, its mismatch state, and the dead-link state
  await page.goto('/reset-password?token=visual-evidence-token');
  await page.getByLabel('New password', { exact: true }).fill('E2ePass1!');
  await shoot(page, '13-reset-default');
  await page.getByLabel('Confirm new password').fill('Different1!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await shoot(page, '14-reset-mismatch');

  await page.goto('/reset-password');
  await expect(
    page.getByRole('heading', { name: 'This reset link is not valid' })
  ).toBeVisible();
  await shoot(page, '15-reset-no-token');

  // Verify email — the failure state a bad token lands on
  await page.goto('/verify-email?token=visual-evidence-token');
  await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 30_000 });
  await shoot(page, '16-verify-failed');
});

test('the session-check panel, and the screens at mobile width', async ({ page }) => {
  // The panel only shows while /api/auth/me is in flight, so hold the response.
  await page.route('**/api/auth/me', () => {});
  await page.goto('/login');
  await expect(page.getByText('Checking session')).toBeVisible();
  await shoot(page, '17-login-checking-session');
  await page.unroute('**/api/auth/me');

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await shoot(page, '18-login-mobile');

  await page.goto('/register');
  await page.getByLabel('Password').fill('E2ePass1!');
  await shoot(page, '19-register-mobile');

  await page.goto('/forgot-password');
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  await shoot(page, '20-forgot-mobile');
});
