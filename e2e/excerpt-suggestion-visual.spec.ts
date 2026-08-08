import { test, expect, type Page } from '@playwright/test';
import { STORAGE_STATE } from './config';
import { settle } from './visual';

// Evidence run: every state the Excerpt Suggestion button defines, captured as
// stills plus a video of the walk-through. Assertions are deliberately thin —
// the behaviour is covered in excerpt-suggestion.spec.ts and the server suite;
// this file exists to show the result.
//
// The happy states drive the real path (editor -> API -> the owned ai/ module
// -> the stub provider). The failure states are staged at the network edge
// instead: a provider that times out and an exhausted hourly budget cannot be
// produced on demand in a browser, and faking them here shows the editor's
// answer without pretending to test the server's.
test.use({ storageState: STORAGE_STATE, video: 'on' });

const SHOTS = 'test-results/excerpt-suggestion-visual';

const CONTENT =
  'Multi-Channel Sync broadcasts one Post to every social channel from a single publish action, ' +
  'so a Creator writes once and reaches an Audience that already reads elsewhere.';

async function shoot(page: Page, name: string) {
  await settle(page);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

function fields(page: Page) {
  return {
    title: page.getByPlaceholder('Enter post title...'),
    content: page.getByPlaceholder('Write your post content in Markdown...'),
    excerpt: page.getByPlaceholder('เว้นว่างเพื่อสร้างอัตโนมัติจากเนื้อหา'),
    suggest: page.getByRole('button', { name: 'Suggest an excerpt' }),
  };
}

test('every Excerpt Suggestion state, desktop', async ({ page }) => {
  await page.goto('/dashboard/posts/new');
  const f = fields(page);
  await expect(f.suggest).toBeVisible();

  // disabled — too little content to summarise
  await f.title.fill('Excerpt Suggestion evidence');
  await f.content.fill('Too short.');
  await expect(f.suggest).toBeDisabled();
  await shoot(page, '01-disabled-content-too-short');

  // idle — enough content, ready to ask
  await f.content.fill(CONTENT);
  await expect(f.suggest).toBeEnabled();
  await shoot(page, '02-idle');

  // loading — the stub answers instantly, so hold the response open long
  // enough for the in-flight state to be visible.
  await page.route('**/api/posts/suggest-excerpt', async (route) => {
    await new Promise((r) => setTimeout(r, 2_000));
    await route.continue();
  });
  await f.suggest.click();
  await expect(page.getByRole('button', { name: 'Suggesting an excerpt…' })).toBeVisible();
  await shoot(page, '03-loading');
  await page.unroute('**/api/posts/suggest-excerpt');

  // filled — the suggestion lands in the field, editable in place
  await expect(f.excerpt).not.toHaveValue('', { timeout: 15_000 });
  await expect(page.getByText('Excerpt suggestion added')).toBeVisible();
  await shoot(page, '04-filled');

  // confirm — the field now holds text, so asking again must ask first
  await f.suggest.click();
  await expect(page.getByRole('heading', { name: 'Replace Excerpt?' })).toBeVisible();
  await shoot(page, '05-confirm-replace');

  // declining leaves the Creator's text exactly as it was
  const before = await f.excerpt.inputValue();
  await page.getByRole('button', { name: 'Keep mine' }).click();
  await expect(f.excerpt).toHaveValue(before);
  await shoot(page, '06-declined-text-untouched');

  // degraded — the provider failed server-side, so the field gets the derived
  // Excerpt and the Creator is told, rather than being sold a truncation as
  // the AI's work.
  await f.excerpt.fill('');
  await page.route('**/api/posts/suggest-excerpt', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ excerpt: CONTENT.slice(0, 150) + '...', source: 'fallback' }),
    })
  );
  await f.suggest.click();
  await expect(page.getByText('AI suggestions are unavailable right now')).toBeVisible();
  await shoot(page, '07-degraded-fallback');
  await page.unroute('**/api/posts/suggest-excerpt');

  // throttled — the hourly budget for this Creator is spent
  await f.excerpt.fill('');
  await page.route('**/api/posts/suggest-excerpt', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Too many excerpt suggestion requests.' }),
    })
  );
  await f.suggest.click();
  await expect(page.getByText("You've asked too often")).toBeVisible();
  await expect(f.suggest).toBeEnabled();
  await shoot(page, '08-throttled');
  await page.unroute('**/api/posts/suggest-excerpt');
});
