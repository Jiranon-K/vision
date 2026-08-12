import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';

let mongo: MongoMemoryServer;
let app: import('express').Express;
let Post: typeof import('../../src/models/Post').default;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  Post = (await import('../../src/models/Post')).default;
  await Post.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
  await Post.syncIndexes();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

async function createPost(
  cookies: string[],
  body: Record<string, unknown> = {}
): Promise<void> {
  const res = await request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: `Post ${Math.random()}`,
      content: 'hello world content here, long enough to be worth excluding',
      category: 'SEO',
      status: 'Published',
      ...body,
    });
  expect(res.status).toBe(201);
}

async function seed(cookies: string[], count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await createPost(cookies, { title: `Numbered Post ${String(i).padStart(2, '0')}` });
  }
}

// Walk every page and return the ids in the order they arrived, so repeats and
// gaps are both visible.
async function walk(
  path: string,
  cookies?: string[],
  query: Record<string, string> = {}
): Promise<string[]> {
  const seen: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const req = request(app).get(path).query({ ...query, ...(cursor ? { cursor } : {}) });
    if (cookies) req.set('Cookie', cookies);
    const res = await req;
    expect(res.status).toBe(200);
    seen.push(...res.body.items.map((p: { _id: string }) => p._id));
    if (!res.body.nextCursor) return seen;
    cursor = res.body.nextCursor;
  }
  throw new Error('Pagination did not terminate');
}

describe('A listing is not the whole Post', () => {
  it('omits content and keeps the fields a listing displays', async () => {
    const a = await register('listing@test.local');
    await createPost(a, { title: 'A Listed Post', excerpt: 'A short summary.' });

    const res = await request(app).get('/api/posts').set('Cookie', a);
    const post = res.body.items[0];

    expect(post.content).toBeUndefined();
    expect(post.title).toBe('A Listed Post');
    expect(post.excerpt).toBe('A short summary.');
    expect(post.category).toBe('SEO');
    expect(post.status).toBe('Published');
    expect(post.slug).toBeTruthy();
    expect(post.readTime).toBeTruthy();
    expect(post.views).toBe(0);
    expect(post.date).toBeTruthy();
  });

  it('still returns full content for a single Post by id', async () => {
    const a = await register('single-id@test.local');
    await createPost(a);
    const list = await request(app).get('/api/posts').set('Cookie', a);

    const res = await request(app)
      .get(`/api/posts/${list.body.items[0]._id}`)
      .set('Cookie', a);
    expect(res.body.content).toBeTruthy();
  });

  it('still returns full content for a Published Post by Slug', async () => {
    const a = await register('single-slug@test.local');
    await createPost(a, { title: 'Read Me Whole' });

    const res = await request(app).get('/api/posts/slug/read-me-whole');
    expect(res.body.content).toBeTruthy();
  });
});

describe('Paging through a listing', () => {
  it('returns exactly the page size and offers a next cursor', async () => {
    const a = await register('page-first@test.local');
    await seed(a, 7);

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ limit: 3 });

    expect(res.body.items).toHaveLength(3);
    expect(typeof res.body.nextCursor).toBe('string');
  });

  it('reaches every Post exactly once and stops', async () => {
    const a = await register('page-walk@test.local');
    await seed(a, 7);

    const ids = await walk('/api/posts', a, { limit: '3' });

    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it('offers no cursor on the last page', async () => {
    const a = await register('page-last@test.local');
    await seed(a, 3);

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ limit: 10 });

    expect(res.body.items).toHaveLength(3);
    expect(res.body.nextCursor).toBeUndefined();
  });

  it('is stable when two Posts share a creation timestamp', async () => {
    const a = await register('page-tie@test.local');
    await seed(a, 4);
    const sameMoment = new Date('2026-01-01T00:00:00.000Z');
    await Post.updateMany({}, { $set: { createdAt: sameMoment } });

    const ids = await walk('/api/posts', a, { limit: '2' });

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('clamps a page size above the maximum', async () => {
    const a = await register('page-clamp@test.local');
    await seed(a, 3);

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ limit: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
  });

  it('refuses a malformed page size', async () => {
    const a = await register('page-bad-limit@test.local');

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ limit: 'lots' });

    expect(res.status).toBe(400);
  });

  it('refuses a malformed cursor', async () => {
    const a = await register('page-bad-cursor@test.local');

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ cursor: 'not-a-cursor' });

    expect(res.status).toBe(400);
  });
});

describe('The rules hold on every page, not only the first', () => {
  it('never hands a Reader a Draft', async () => {
    const a = await register('page-reader@test.local');
    await seed(a, 4);
    await createPost(a, { title: 'Hidden Draft', status: 'Draft' });

    const ids = await walk('/api/posts/public', undefined, { limit: '2' });

    expect(ids).toHaveLength(4);
    const drafts = await Post.find({ status: 'Draft' }).select('_id');
    expect(ids).not.toContain(String(drafts[0]._id));
  });

  it('never hands a Creator another Creator’s Post', async () => {
    const a = await register('page-mine@test.local');
    await seed(a, 3);
    const b = await register('page-theirs@test.local');
    await seed(b, 5);

    const ids = await walk('/api/posts', a, { limit: '2' });

    expect(ids).toHaveLength(3);
  });

  it('narrows by filter before paginating', async () => {
    const a = await register('page-filter@test.local');
    await seed(a, 3);
    await createPost(a, { title: 'Content Post', category: 'Content' });

    const ids = await walk('/api/posts', a, { limit: '2', category: 'Content' });

    expect(ids).toHaveLength(1);
  });

  it('pages a search result without repeats', async () => {
    const a = await register('page-search@test.local');
    for (let i = 0; i < 5; i++) {
      await createPost(a, { title: `Kubernetes Chapter ${i}` });
    }
    await createPost(a, { title: 'Unrelated Marketing Note' });

    const ids = await walk('/api/posts', a, { limit: '2', search: 'kubernetes' });

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });
});
