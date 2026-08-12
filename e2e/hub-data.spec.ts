import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './config';

// The Hub's screens are the interface; the hooks behind them are
// implementation. Testing a hook in isolation would assert the query library's
// behaviour rather than the product's, so these drive the Hub as a Creator does
// and watch what renders and what is requested.
test.describe('the Hub fetches through one seam', () => {
  test.use({ storageState: STORAGE_STATE });

  test('two screens needing the same data make one request between them', async ({
    page,
  }) => {
    const analyticsCalls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/analytics')) analyticsCalls.push(url);
    });

    await page.goto('/dashboard');
    await expect(page.getByText('Total Views')).toBeVisible();
    const afterDashboard = analyticsCalls.length;
    expect(afterDashboard).toBeGreaterThan(0);

    // The analytics screen reads the same two queries under the same keys, so
    // it renders from cache rather than asking again.
    await page.getByRole('link', { name: 'Analytics', exact: true }).click();
    await page.waitForURL(/\/dashboard\/analytics$/, { timeout: 30_000 });
    await expect(page.getByText('Total Views')).toBeVisible();

    expect(analyticsCalls.length).toBe(afterDashboard);
  });

  test('returning to a screen renders immediately, without a blanking load', async ({
    page,
  }) => {
    await page.goto('/dashboard/posts');
    await expect(page.getByRole('heading', { name: /posts/i }).first()).toBeVisible();
    const firstRow = page.getByRole('button', { name: /^Edit / }).first();
    await expect(firstRow).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
    await page.getByRole('link', { name: 'Posts' }).click();
    await page.waitForURL(/\/dashboard\/posts$/, { timeout: 30_000 });

    // Cached data is on screen straight away: no skeleton stands between the
    // Creator and their own Posts on a second visit.
    await expect(firstRow).toBeVisible({ timeout: 1_000 });
  });

  test('deleting a Post removes it from the Hub without a manual reload', async ({
    page,
  }) => {
    const title = `Disposable Post ${Date.now()}`;

    await page.goto('/dashboard/posts/new');
    await page.getByPlaceholder('Untitled Post').fill(title);
    await page
      .getByPlaceholder(
        'Start writing. Markdown works; so does thinking out loud.',
      )
      .fill('This Post exists to be deleted by the Hub data test.');
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.getByRole('radio', { name: 'SEO', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Save now' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();

    // The save invalidates the Posts list, so navigating to it shows the new
    // Post without a reload.
    await page.getByRole('button', { name: 'Posts', exact: true }).click();
    await page.waitForURL(/\/dashboard\/posts(\?|$)/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: `Edit ${title}` })).toBeVisible();

    await page.getByRole('button', { name: `Delete ${title}` }).click();
    await page.getByRole('button', { name: 'ลบ', exact: true }).click();

    await expect(
      page.getByRole('button', { name: `Edit ${title}` }),
    ).toHaveCount(0, { timeout: 30_000 });
  });
});
