import crypto from 'crypto';
import { test, expect, type APIRequestContext } from '@playwright/test';
import { MongoClient } from 'mongodb';
import { API_URL, E2E_MONGODB_URI, SEEDED_PUBLISHED_POST, STORAGE_STATE } from './config';

// Followers (Jiranon-K/vision#29, ADR 0009) through the browser: a Reader
// follows from the end of a Post, and a Creator sees the Delivery choice with
// its reach when publishing.

async function seededPost(request: APIRequestContext): Promise<{ _id: string; slug: string }> {
  const res = await request.get(`${API_URL}/api/posts/public`);
  const { items } = await res.json();
  const post = items.find((p: { title: string }) => p.title === SEEDED_PUBLISHED_POST.title);
  expect(post, 'the seeded Published Post').toBeDefined();
  return post;
}

// The confirmation token only ever exists in the email, which the E2E
// environment never sends. Replacing its stored hash with one for a token the
// test knows is the one step that has to reach past the API.
async function confirmFollower(request: APIRequestContext, postId: string, email: string) {
  const follow = await request.post(`${API_URL}/api/followers`, { data: { postId, email } });
  expect(follow.status()).toBe(202);

  const token = crypto.randomBytes(32).toString('hex');
  const client = new MongoClient(E2E_MONGODB_URI);
  await client.connect();
  try {
    await client
      .db()
      .collection('followers')
      .updateOne({ email }, { $set: { confirmTokenHash: crypto.createHash('sha256').update(token).digest('hex') } });
  } finally {
    await client.close();
  }

  const confirm = await request.post(`${API_URL}/api/followers/confirm`, { data: { token } });
  expect(confirm.status()).toBe(200);
}

test('a Reader follows the Creator from the end of a Post', async ({ page, request }) => {
  const post = await seededPost(request);
  await page.goto(`/blog/${post.slug}`);

  const card = page.getByRole('region', { name: /^Follow / });
  await card.getByRole('button', { name: 'Follow', exact: true }).click();

  const email = card.getByRole('textbox', { name: 'Email address' });
  await email.fill('not-an-email');
  await card.getByRole('button', { name: /^Follow / }).click();
  await expect(card.getByText('Enter an email address like name@example.com')).toBeVisible();

  await email.fill('e2e.reader@example.com');
  await card.getByRole('button', { name: /^Follow / }).click();
  await expect(card.getByText('Check your inbox to confirm')).toBeVisible();
});

test.describe('the Creator publishing', () => {
  test.use({ storageState: STORAGE_STATE });

  // Regression: the pill read window.scrollY, which stays 0 because <body> is
  // this app's scroll container, so it never appeared.
  test('a Follow pill joins the Reader partway down a long Post', async ({ page, request }) => {
    const long = Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1}. ${'Worth reading slowly. '.repeat(12)}`).join('\n\n');
    const created = await request.post(`${API_URL}/api/posts`, {
      data: { title: 'A Long Post to Follow From', content: long, category: 'SEO', status: 'Published' },
    });
    const { slug } = await created.json();

    await page.goto(`/blog/${slug}`);
    const pill = page.getByRole('button', { name: /^Follow E2E$/ });
    await expect(pill).toHaveCount(0);

    await page.evaluate(() => document.body.scrollTo(0, document.body.scrollHeight * 0.45));
    await expect(pill).toBeVisible();

    await pill.click();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeFocused();
  });

  test('sees the Delivery choice, on by default, with how many Followers it reaches', async ({ page, request }) => {
    const post = await seededPost(request);
    await confirmFollower(request, post._id, 'e2e.first@example.com');
    await confirmFollower(request, post._id, 'e2e.second@example.com');

    await page.goto('/dashboard/posts/new');
    await page.getByRole('textbox', { name: 'Post title' }).fill('Delivered in E2E');
    await page.getByRole('textbox', { name: 'Post content' }).fill('Something the Followers should read.');
    await page.getByRole('button', { name: /^Publish/ }).click();

    const sheet = page.getByRole('dialog', { name: 'Publish this Post' });
    await sheet.getByRole('radio', { name: 'SEO' }).click();
    await sheet.getByRole('radio', { name: /^Published/ }).click();

    const deliver = sheet.getByRole('checkbox', { name: 'Email this Post to 2 Followers' });
    await expect(deliver).toBeChecked();
    await expect(sheet.getByText('via Vision')).toBeVisible();
  });
});
