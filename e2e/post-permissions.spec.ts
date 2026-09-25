import { test, expect, type Route } from '@playwright/test';
import { STORAGE_STATE } from './config';

test.describe('the dashboard renders controls from server permissions', () => {
  test.use({ storageState: STORAGE_STATE });

  const rewrite =
    (change: (post: Record<string, unknown>, index: number) => void) =>
    async (route: Route) => {
      const response = await route.fetch();
      const body = await response.json();
      if (Array.isArray(body?.items)) body.items.forEach(change);
      else change(body, 0);
      await route.fulfill({ response, json: body });
    };

  const withoutPermissions = rewrite((post) => {
    delete post.permissions;
  });

  const HUB_LISTING = /\/api\/posts(\?|$)/;
  const SINGLE_POST = /\/api\/posts\/[0-9a-f]{24}$/;

  test('shows edit and delete where the server grants them', async ({ page }) => {
    await page.goto('/dashboard/posts');
    await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete / }).first()).toBeVisible();
  });

  test('labels a Post read-only, offering only Open, when the field is absent', async ({ page }) => {
    await page.route(HUB_LISTING, withoutPermissions);

    await page.goto('/dashboard/posts');
    await expect(page.getByText('Read-only', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Open / }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(0);
  });

  test('tells the Creator in the Hub that a Post is Withheld', async ({ page }) => {
    await page.route(
      HUB_LISTING,
      rewrite((post, i) => {
        if (i === 0) post.withheld = true;
      })
    );

    await page.goto('/dashboard/posts');
    const notice = page.getByRole('note', { name: 'Withheld' });
    await expect(notice).toHaveCount(1);
    await expect(notice).toContainText("Readers can't see this Post");
  });

  test('opens a Post read-only when its permissions are absent', async ({ page }) => {
    await page.goto('/dashboard/posts');
    const edit = page.getByRole('button', { name: /^Edit / }).first();
    await expect(edit).toBeVisible();

    await page.route(SINGLE_POST, withoutPermissions);
    await edit.click();

    const panel = page.getByRole('complementary', { name: 'Visibility' });
    await expect(panel).toContainText('Read-only');
    await expect(panel).toContainText("Only this Post's Creator can edit, publish or delete it");
  });

  test('shows a Withheld Post’s history in the editor, and no panel otherwise', async ({ page }) => {
    await page.goto('/dashboard/posts');
    const edit = page.getByRole('button', { name: /^Edit / }).first();
    await expect(edit).toBeVisible();
    await edit.click();
    await expect(page.locator('[data-editor-surface]')).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Visibility' })).toHaveCount(0);

    await page.route(SINGLE_POST, rewrite((post) => {
      post.withheld = true;
    }));
    await page.reload();

    const panel = page.getByRole('complementary', { name: 'Visibility' });
    await expect(panel).toContainText('Withheld by Vision');
    await expect(panel).toContainText("Publishing again won't make it visible");

    await panel.getByRole('button', { name: 'Visibility' }).click();
    await expect(panel.getByText('Withheld by Vision')).toBeHidden();
  });
});
