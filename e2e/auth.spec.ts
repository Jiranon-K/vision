import { test, expect } from '@playwright/test';

test('anonymous visitor is redirected away from the dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL(/\/login/);
  await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
});

test('a Creator can register, log out, log back in, and reach the dashboard', async ({
  page,
}) => {
  // A fresh address per run keeps this test independent of the seeded Creator.
  const email = `signup-${Date.now()}@e2e.local`;
  const password = 'E2ePass1!';

  await page.goto('/register');
  await page.getByLabel('Full name').fill('Signup Creator');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Registration resolves to the success panel rather than navigating on its own.
  await expect(
    page.getByRole('heading', { name: 'Account created' })
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole('link', { name: 'Go to dashboard' }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Log back in through the UI so the login form itself is covered once.
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Signed in' })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole('link', { name: 'Go to dashboard' }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);
});

test('register rejects a weak password at the field, not with a bare failure', async ({
  page,
}) => {
  await page.goto('/register');

  await page.getByLabel('Full name').fill('Weak Password Creator');
  await page.getByLabel('Email').fill(`weak-${Date.now()}@e2e.local`);
  await page.getByLabel('Password').fill('short');
  await expect(page.getByText('8+ characters')).toBeVisible();

  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Check the highlighted fields below.')).toBeVisible();
  await expect(page.getByText('Password must meet all requirements')).toBeVisible();
  await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');

  // Fixing the field clears its error and the banner with it.
  await page.getByLabel('Password').fill('E2ePass1!');
  await expect(
    page.getByText('Check the highlighted fields below.')
  ).toBeHidden();
});

test('login flags a malformed email at the field', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').fill('whatever');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Check the highlighted fields below.')).toBeVisible();
  await expect(page.getByText('Enter a valid email address')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
