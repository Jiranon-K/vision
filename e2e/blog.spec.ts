import { test, expect } from '@playwright/test';
import { API_URL, CREATOR, SEEDED_PUBLISHED_POST, STORAGE_STATE } from './config';

// Guards the contract between src/lib/posts.ts and the API: this path is a
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

test.describe('the Creator’s Byline', () => {
  test.use({ storageState: STORAGE_STATE });

  test('shows only the name until there is a Byline, then shows it beneath', async ({
    page,
    request,
  }) => {
    const created = await request.post(`${API_URL}/api/posts`, {
      data: { ...SEEDED_PUBLISHED_POST, title: 'Byline Check Post' },
    });
    const { slug } = await created.json();

    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole('heading', { name: 'Byline Check Post' })).toBeVisible();
    await expect(page.locator('[data-byline]')).toHaveCount(0);
    await expect(page.getByText(/\b(Admin|Author)\b/)).toHaveCount(0);

    const profile = await request.put(`${API_URL}/api/settings/profile`, {
      data: { name: CREATOR.name, byline: 'Writes about search' },
    });
    expect(profile.ok()).toBe(true);

    await page.reload();
    await expect(page.locator('[data-byline]').first()).toHaveText('“Writes about search”');

    await request.put(`${API_URL}/api/settings/profile`, {
      data: { name: CREATOR.name, byline: '' },
    });
  });
});
