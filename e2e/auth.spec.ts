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
  await page.getByPlaceholder('John Doe').fill('Signup Creator');
  await page.getByPlaceholder('you@example.com').fill(email);
  const registerPasswords = page.getByPlaceholder('••••••••');
  await registerPasswords.nth(0).fill(password);
  await registerPasswords.nth(1).fill(password);
  await page.getByRole('button', { name: /join now/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Log back in through the UI so the login form itself is covered once.
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);
});
