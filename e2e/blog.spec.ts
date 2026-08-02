import { test, expect } from '@playwright/test';
import { SEEDED_PUBLISHED_POST } from './config';

// Guards the contract between lib/posts.ts and the API: this path is a
// server-side fetch at render time, so a shape change breaks the page rather
// than surfacing as a type error.
test('blog lists a published post and its detail page renders', async ({ page }) => {
  await page.goto('/blog');

  const card = page.getByRole('link', { name: new RegExp(SEEDED_PUBLISHED_POST.title, 'i') });
  await expect(card.first()).toBeVisible();

  await card.first().click();
  await page.waitForURL(/\/blog\/[^/]+$/);

  await expect(
    page.getByRole('heading', { name: new RegExp(SEEDED_PUBLISHED_POST.title, 'i') })
  ).toBeVisible();
  await expect(page.getByText(SEEDED_PUBLISHED_POST.content.slice(0, 40))).toBeVisible();
});
