import { beforeAll, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { setupTestDb } from '../../../tests/support/test-db';
import type { Actor } from '../auth';

// The Posts rules called directly, with an actor built in the test — no HTTP.
// The integration suite covers the same rules through requests; these pin them
// at the seam the controller now calls.

setupTestDb();

// Imported once the environment is set: the auth entry file reads it at import.
let posts: typeof import('./posts.service');
let Post: typeof import('./post.model').default;

beforeAll(async () => {
  posts = await import('./posts.service');
  Post = (await import('./post.model')).default;
});

const creator = (): Actor => ({
  kind: 'creator',
  id: new Types.ObjectId().toString(),
});
const admin = (): Actor => ({
  kind: 'admin',
  id: new Types.ObjectId().toString(),
});
const READER: Actor = { kind: 'reader' };

const draft = (title: string, extra: Record<string, unknown> = {}) => ({
  title,
  content: `${title} body text`,
  category: 'Tech',
  status: 'Draft',
  ...extra,
});
const published = (title: string, extra: Record<string, unknown> = {}) =>
  draft(title, { status: 'Published', ...extra });

const idOf = (post: Record<string, unknown>) => String(post._id);

const titles = (page: { items: Record<string, unknown>[] }) =>
  page.items.map((p) => p.title).sort();

describe('list scope per actor', () => {
  it('a Creator lists their own Posts, Draft and Published, and nobody else’s', async () => {
    const alice = creator();
    const bob = creator();
    await posts.createPost(alice, draft('Alice draft'), 'Alice');
    await posts.createPost(alice, published('Alice live'), 'Alice');
    await posts.createPost(bob, published('Bob live'), 'Bob');

    expect(titles(await posts.listPosts(alice, {}))).toEqual([
      'Alice draft',
      'Alice live',
    ]);
    expect(titles(await posts.listPosts(bob, {}))).toEqual(['Bob live']);
  });

  it('an Admin lists every Post; a Reader only Published ones, without owners', async () => {
    const alice = creator();
    await posts.createPost(alice, draft('Hidden draft'), 'Alice');
    await posts.createPost(alice, published('Open post'), 'Alice');

    expect(titles(await posts.listPosts(admin(), {}))).toEqual([
      'Hidden draft',
      'Open post',
    ]);

    const page = await posts.listPublishedPosts({});
    expect(titles(page)).toEqual(['Open post']);
    expect(page.items[0]).not.toHaveProperty('owner');
    expect(page.items[0]).not.toHaveProperty('withheld');
    expect(page.items[0]).not.toHaveProperty('content');
  });

  it('a Reader cannot read a Draft, and is told it does not exist', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, draft('Secret'), 'Alice');

    await expect(posts.getPost(READER, idOf(post))).rejects.toMatchObject({
      status: 404,
    });
    await expect(posts.getPost(creator(), idOf(post))).rejects.toMatchObject({
      status: 404,
    });
    expect((await posts.getPost(alice, idOf(post))).title).toBe('Secret');
  });

  it('only the owner may change a Post', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, draft('Mine'), 'Alice');

    await expect(
      posts.updatePost(creator(), idOf(post), { title: 'Taken' })
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      posts.deletePost(admin(), idOf(post))
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('Withheld visibility', () => {
  it('a Withheld Post leaves every Reader surface and comes back on restore', async () => {
    const alice = creator();
    const moderator = admin();
    const post = await posts.createPost(alice, published('Disputed'), 'Alice');
    const id = idOf(post);
    const slug = String(post.slug);

    const withheld = await posts.withholdPost(moderator, id, { reason: 'Spam' });
    expect(withheld.withheld).toBe(true);

    expect((await posts.listPublishedPosts({})).items).toHaveLength(0);
    await expect(posts.getPublishedBySlug(slug)).rejects.toMatchObject({
      status: 404,
    });
    await expect(posts.getPost(READER, id)).rejects.toMatchObject({ status: 404 });
    // The owner still sees it in the Hub, marked as withheld.
    expect((await posts.getPost(alice, id)).withheld).toBe(true);

    await posts.restorePost(moderator, id);
    expect(titles(await posts.listPublishedPosts({}))).toEqual(['Disputed']);
    expect(await posts.getPublishedBySlug(slug)).toHaveProperty('post');
  });

  it('a Creator may neither withhold nor restore, even their own Post', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, published('Own'), 'Alice');

    await expect(
      posts.withholdPost(alice, idOf(post), { reason: 'x' })
    ).rejects.toMatchObject({ status: 403 });
    await expect(posts.restorePost(alice, idOf(post))).rejects.toMatchObject({
      status: 403,
    });
  });

  it('withholding requires a reason', async () => {
    const post = await posts.createPost(creator(), published('Any'), 'A');
    await expect(
      posts.withholdPost(admin(), idOf(post), { reason: '   ' })
    ).rejects.toMatchObject({ status: 400, message: 'Validation failed' });
  });
});

describe('Slug stability', () => {
  it('a Draft’s Slug follows its title', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, draft('First title'), 'Alice');
    expect(post.slug).toBe('first-title');

    const retitled = await posts.updatePost(alice, idOf(post), {
      title: 'Second title',
    });
    expect(retitled.slug).toBe('second-title');
  });

  it('a Published Slug survives a retitle', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, published('Launch day'), 'Alice');

    const retitled = await posts.updatePost(alice, idOf(post), {
      title: 'Launch day, revisited',
    });
    expect(retitled.slug).toBe('launch-day');
  });

  it('a deliberate move keeps the old address answering with the new one', async () => {
    const alice = creator();
    const post = await posts.createPost(alice, published('Old name'), 'Alice');

    await posts.updatePost(alice, idOf(post), { slug: 'new-name' });

    expect(await posts.getPublishedBySlug('old-name')).toEqual({
      movedTo: 'new-name',
    });
    expect(await posts.getPublishedBySlug('new-name')).toHaveProperty('post');
  });

  it('an address another Post answers at, or used to, is refused', async () => {
    const alice = creator();
    const first = await posts.createPost(alice, published('Taken'), 'Alice');
    await posts.updatePost(alice, idOf(first), { slug: 'moved' });

    await expect(
      posts.createPost(alice, draft('Other', { slug: 'taken' }), 'Alice')
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('search', () => {
  it('ignores a term shorter than the minimum, and matches a longer one', async () => {
    const alice = creator();
    await posts.createPost(alice, published('Typescript tips'), 'Alice');
    await posts.createPost(alice, published('Gardening notes'), 'Alice');

    const short = 'g'.repeat(posts.MIN_SEARCH_LENGTH - 1);
    expect(
      (await posts.listPublishedPosts({ search: short })).items
    ).toHaveLength(2);
    expect(
      titles(await posts.listPublishedPosts({ search: 'gardening' }))
    ).toEqual(['Gardening notes']);
  });
});

describe('pagination bounds', () => {
  const seed = async (count: number, owner: Actor & { id: string }) => {
    const base = Date.UTC(2026, 0, 1);
    await Post.insertMany(
      Array.from({ length: count }, (_, i) => ({
        title: `Post ${i}`,
        excerpt: 'x',
        content: 'x',
        category: 'Tech',
        status: 'Published',
        readTime: '1 min read',
        slug: `post-${i}`,
        owner: owner.id,
        author: { name: 'Seeded' },
        createdAt: new Date(base + i * 1000),
      }))
    );
  };

  it('clamps an oversized page to the maximum and pages without overlap', async () => {
    const alice = creator() as Actor & { id: string };
    await seed(55, alice);

    const first = await posts.listPosts(alice, { limit: '500' });
    expect(first.items).toHaveLength(50);
    expect(first.nextCursor).toBeDefined();

    const second = await posts.listPosts(alice, {
      limit: '500',
      cursor: first.nextCursor,
    });
    expect(second.items).toHaveLength(5);
    expect(second.nextCursor).toBeUndefined();

    const seen = new Set([...first.items, ...second.items].map(idOf));
    expect(seen.size).toBe(55);
  });

  it('refuses a malformed limit or cursor', async () => {
    const alice = creator();
    await expect(posts.listPosts(alice, { limit: '0' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(posts.listPosts(alice, { limit: 'ten' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      posts.listPublishedPosts({ cursor: 'not-a-cursor' })
    ).rejects.toMatchObject({ status: 400 });
  });
});
