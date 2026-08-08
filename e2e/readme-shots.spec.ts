import { test, expect, request as playwrightRequest, type Page } from '@playwright/test';
import { MongoClient } from 'mongodb';
import {
  API_URL,
  DEMO_CREATOR,
  DEMO_EDITOR_CONTENT,
  DEMO_EDITOR_TITLE,
  DEMO_ENGAGEMENT,
  DEMO_PAGE_VIEWS,
  DEMO_POSTS,
  DEMO_SUBSCRIBERS,
  E2E_MONGODB_URI,
  SHOTS_DIR,
  STORAGE_STATE,
  slugify,
} from './config';
import { settle, settleAnimations } from './visual';

// The four product shots the README carries. This is evidence, not regression
// coverage: it is excluded from `test:e2e` so CI never rewrites the committed
// PNGs. Regenerate deliberately, when the UI actually changes:
//
//   bun run screenshots
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });

test.beforeAll(async () => {
  // Posts go through the API as the Demo Creator, the same path a Creator uses —
  // and the only path that puts a real Creator name on the blog cards, because
  // createPost copies req.user.name into the Post.
  const api = await playwrightRequest.newContext();
  const register = await api.post(`${API_URL}/api/auth/register`, { data: DEMO_CREATOR });
  expect(register.status(), await register.text()).toBe(201);

  for (const post of DEMO_POSTS) {
    // `views` is seeded separately below — the create endpoint does not accept it.
    const created = await api.post(`${API_URL}/api/posts`, {
      data: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        status: post.status,
        featured: post.featured,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
  }

  // Views and the weekly chart are written straight to Mongo because the product
  // has no write path for them: routes/analytics.ts is GET-only, and Post.views
  // moves solely through POST /api/posts/:id/view — thousands of calls to reach
  // numbers that look like a real Creator's.
  const client = new MongoClient(E2E_MONGODB_URI);
  await client.connect();
  const db = client.db();

  // This project depends on `setup`, which seeds the two thin SEEDED_* Posts the
  // regression specs assert on. They would land in the blog grid as a half-empty
  // extra row titled "Seeded Published Post", so drop everything that is not the
  // Demo Creator's before framing the shot.
  await db.collection('posts').deleteMany({ 'author.name': { $ne: DEMO_CREATOR.name } });

  for (const post of DEMO_POSTS) {
    await db
      .collection('posts')
      .updateOne({ slug: slugify(post.title) }, { $set: { views: post.views } });
  }

  const midnight = new Date();
  midnight.setHours(12, 0, 0, 0);
  await db.collection('analytics').insertMany(
    DEMO_PAGE_VIEWS.map((pageViews, index) => ({
      date: new Date(midnight.getTime() - (DEMO_PAGE_VIEWS.length - 1 - index) * 86_400_000),
      pageViews,
      posts: [],
      subscribers: DEMO_SUBSCRIBERS,
      engagement: DEMO_ENGAGEMENT,
    }))
  );
  await client.close();

  // The collection names above are Mongoose's pluralisation, inferred rather
  // than declared. Prove the writes landed where the API reads — a silent miss
  // would commit a flat-zero chart into the README.
  const check = await playwrightRequest.newContext();
  const views: { value: number }[] = await (await check.get(`${API_URL}/api/analytics/views`)).json();
  expect(Math.max(...views.map((day) => day.value))).toBe(Math.max(...DEMO_PAGE_VIEWS));
  const stats: { label: string; value: string }[] = await (
    await check.get(`${API_URL}/api/analytics`)
  ).json();
  expect(stats.find((stat) => stat.label === 'Subscribers')?.value).toBe(String(DEMO_SUBSCRIBERS));
  await check.dispose();
  await api.dispose();
});

// The shots are taken against `next dev`, which floats its own dev-tools badge
// over the bottom-left corner. It is not part of the product.
const HIDE_DEV_OVERLAY = 'nextjs-portal { display: none !important; }';

async function shoot(
  page: Page,
  name: string,
  fullPage = false,
  clip?: { x: number; y: number; width: number; height: number }
) {
  await settle(page);
  await page.addStyleTag({ content: HIDE_DEV_OVERLAY });
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage, clip });
}

test('landing', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByAltText('Digital Marketing Illustration')).toBeVisible();
  await settleAnimations(page, ['.header-word', '.header-para', '.header-cta', '.header-image']);
  await shoot(page, 'landing');
});

test('blog', async ({ page }) => {
  // Tall enough to hold the whole listing at once: the grid cards animate on an
  // IntersectionObserver, so anything outside the viewport stays at opacity 0
  // and settleAnimations would hang waiting for it.
  await page.setViewportSize({ width: 1440, height: 2200 });
  await page.goto('/blog');
  // Assert on the seeded Post rather than trusting the render, so a listing that
  // came back empty fails loudly instead of shipping as a screenshot.
  await expect(page.getByRole('heading', { name: DEMO_POSTS[0].title })).toBeVisible();
  await settleAnimations(page, ['.hero-anim', '.featured-card', '.blog-card']);

  // Crop to the last card rather than to a guessed height: the frame then ends
  // on a complete row whatever the copy does to the card heights.
  const lastCard = page.locator('.blog-card').last();
  const box = await lastCard.boundingBox();
  if (!box) throw new Error('No .blog-card to frame the blog screenshot against');
  await shoot(page, 'blog', false, {
    x: 0,
    y: 0,
    width: 1440,
    height: Math.ceil(box.y + box.height + 64),
  });
});

test.describe('signed in as a Creator', () => {
  test.use({ storageState: STORAGE_STATE, viewport: { width: 1440, height: 1000 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // The dashboard header carries an unverified-email banner for any Creator
      // registered through the API, and the editor offers to restore a leftover
      // draft. Neither belongs in a product screenshot.
      sessionStorage.setItem('vision:unverified-banner-dismissed', 'true');
      localStorage.removeItem('post-draft:new');
    });
  });

  test('dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Weekly Views Trend' })).toBeVisible();
    await settleAnimations(page, [
      '.stats-card',
      '.quick-action',
      '.post-card',
      '.analytics-chart',
    ]);
    await shoot(page, 'dashboard', true);
  });

  test('editor', async ({ page }) => {
    // Framed to end just below the split pane: the Post Settings form beneath it
    // carries Thai placeholder copy that reads as an accident in an English README.
    await page.setViewportSize({ width: 1440, height: 715 });
    await page.goto('/dashboard/posts/new');
    await page.getByPlaceholder('Enter post title...').fill(DEMO_EDITOR_TITLE);
    await page
      .getByPlaceholder('Write your post content in Markdown...')
      .fill(DEMO_EDITOR_CONTENT);
    await page.getByLabel('Category').selectOption('Social Media');
    await page.getByLabel('Status').selectOption('Draft');
    // The right pane shows a placeholder until content is typed; wait for the
    // rendered heading so the shot is of a live preview, not an empty panel.
    await expect(page.getByRole('heading', { name: 'One Post, every channel' })).toBeVisible();
    await settleAnimations(page, ['.editor-header', '.editor-content', '.metadata-form']);
    // Clipped rather than fullPage: below the split pane sits the Post Settings
    // form, which a fullPage shot cuts through mid-field.
    // Deliberately never clicks Save Post — saving navigates to /dashboard/posts.
    await shoot(page, 'editor');
  });
});
