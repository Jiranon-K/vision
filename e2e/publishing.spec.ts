import { test, expect } from '@playwright/test';
import { SEEDED_DRAFT_POST, STORAGE_STATE, slugify } from './config';

// The core product loop, and the only test that crosses every layer:
// dashboard -> Express -> Mongo -> public blog. It also watches a requirement
// CONTEXT.md states directly — a Draft is not visible to Readers.
//
// Assertions target post detail pages, not /blog. The listing carries
// `revalidate = 300`, so its contents lag by up to five minutes; a detail page
// for a slug nobody has requested yet renders fresh. For the same reason the
// draft-leak check uses the seeded draft, whose URL is never published — hitting
// the new post's URL before publishing would cache the 404 for five minutes.
test.describe('publishing', () => {
  test.use({ storageState: STORAGE_STATE });

  test('a Draft becomes readable on the public blog only once published', async ({
    page,
    browser,
  }) => {
    const title = `Publishing Flow ${Date.now()}`;
    const body = 'Content written by the publishing end-to-end test.';

    const anonymous = await browser.newContext();
    const anonymousPage = await anonymous.newPage();

    // A Draft is not readable by an anonymous Reader.
    const draftResponse = await anonymousPage.goto(`/blog/${slugify(SEEDED_DRAFT_POST.title)}`);
    expect(draftResponse?.status()).toBe(404);

    await page.goto('/dashboard/posts/new');
    await page.getByPlaceholder('Enter post title...').fill(title);
    await page.getByPlaceholder('Write your post content in Markdown...').fill(body);
    await page.getByLabel('Category').selectOption('SEO');
    await page.getByLabel('Status').selectOption('Draft');
    await page.getByRole('button', { name: 'Save Post' }).click();
    await page.waitForURL(/\/dashboard\/posts(\?|$)/, { timeout: 30_000 });

    await page.getByRole('button', { name: `Edit ${title}` }).click();
    await page.waitForURL(/\/dashboard\/posts\/[^/]+\/edit$/, { timeout: 30_000 });
    await page.getByLabel('Status').selectOption('Published');
    await page.getByRole('button', { name: 'Update Post' }).click();
    await page.waitForURL(/\/dashboard\/posts(\?|$)/, { timeout: 30_000 });

    const publishedResponse = await anonymousPage.goto(`/blog/${slugify(title)}`);
    expect(publishedResponse?.status()).toBe(200);
    await expect(anonymousPage.getByRole('heading', { name: title })).toBeVisible();
    await expect(anonymousPage.getByText(body)).toBeVisible();

    await anonymous.close();
  });
});
