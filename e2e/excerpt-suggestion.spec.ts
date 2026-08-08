import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './config';

// Exercises the real path — editor -> API -> the owned ai/ module -> the
// stub provider (AI_PROVIDER=stub, see e2e/config.ts) — without an AI account.
test.describe('excerpt suggestion', () => {
  test.use({ storageState: STORAGE_STATE });

  test('a Creator asks for a suggestion and it lands in the Excerpt field', async ({ page }) => {
    await page.goto('/dashboard/posts/new');

    await page.getByPlaceholder('Enter post title...').fill('Excerpt Suggestion E2E');
    await page
      .getByPlaceholder('Write your post content in Markdown...')
      .fill(
        'This post has more than enough content for the Excerpt Suggestion feature to summarise it into a short excerpt.'
      );

    const excerptField = page.getByPlaceholder('เว้นว่างเพื่อสร้างอัตโนมัติจากเนื้อหา');
    await expect(excerptField).toHaveValue('');

    const suggestButton = page.getByRole('button', { name: 'Suggest an excerpt' });
    await expect(suggestButton).toBeEnabled();
    await suggestButton.click();

    await expect(excerptField).not.toHaveValue('', { timeout: 15_000 });
    await expect(page.getByText('Excerpt suggestion added')).toBeVisible();

    // Editable in place — the Creator owns the suggestion, it isn't a decision
    // made for them.
    await excerptField.fill('A hand-edited excerpt.');
    await expect(excerptField).toHaveValue('A hand-edited excerpt.');
  });
});
