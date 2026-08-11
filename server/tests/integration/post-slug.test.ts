import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';

let mongo: MongoMemoryServer;
let app: import('express').Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  // The unique index on slug is what the retry path reacts to, so it has to
  // exist before the concurrency case runs.
  await (await import('../../src/models/Post')).default.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
  await (await import('../../src/models/Post')).default.syncIndexes();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

function createPost(cookies: string[], body: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: 'The Original Headline',
      content: 'hello world content here',
      category: 'SEO',
      status: 'Draft',
      ...body,
    });
}

const update = (cookies: string[], id: string, body: Record<string, unknown>) =>
  request(app).put(`/api/posts/${id}`).set('Cookie', cookies).send(body);

describe('A Draft’s Slug follows its title', () => {
  it('changes when the title changes', async () => {
    const a = await register('draftslug@test.local');
    const created = await createPost(a);
    expect(created.body.slug).toBe('the-original-headline');

    const edited = await update(a, created.body._id, {
      title: 'A Completely Different Headline',
    });
    expect(edited.body.slug).toBe('a-completely-different-headline');
  });
});

describe('A Published Slug stops moving', () => {
  it('is fixed at publish and survives a retitle', async () => {
    const a = await register('pubslug@test.local');
    const created = await createPost(a);
    const id = created.body._id;

    const published = await update(a, id, { status: 'Published' });
    expect(published.body.slug).toBe('the-original-headline');

    const retitled = await update(a, id, { title: 'Fixed A Typo In The Headline' });
    expect(retitled.body.slug).toBe('the-original-headline');

    const read = await request(app).get('/api/posts/slug/the-original-headline');
    expect(read.status).toBe(200);
    expect(read.body.title).toBe('Fixed A Typo In The Headline');
  });

  it('moves only when the Creator sets it, and the old address redirects', async () => {
    const a = await register('moveslug@test.local');
    const created = await createPost(a, { status: 'Published' });

    const moved = await update(a, created.body._id, { slug: 'a-better-address' });
    expect(moved.body.slug).toBe('a-better-address');

    const old = await request(app).get('/api/posts/slug/the-original-headline');
    expect(old.status).toBe(301);
    expect(old.body.slug).toBe('a-better-address');

    const current = await request(app).get('/api/posts/slug/a-better-address');
    expect(current.status).toBe(200);
  });

  it('refuses to hand a retained address to a different Post', async () => {
    const a = await register('retained@test.local');
    const first = await createPost(a, { status: 'Published' });
    await update(a, first.body._id, { slug: 'moved-on' });

    const second = await createPost(a, {
      title: 'Second Post',
      status: 'Published',
    });
    const clash = await update(a, second.body._id, {
      slug: 'the-original-headline',
    });
    expect(clash.status).toBe(400);
  });

  it('refuses a Slug another Post currently answers at', async () => {
    const a = await register('clash@test.local');
    await createPost(a, { title: 'Taken Address', status: 'Published' });
    const second = await createPost(a, { title: 'Second', status: 'Published' });

    const clash = await update(a, second.body._id, { slug: 'taken-address' });
    expect(clash.status).toBe(400);
  });
});

describe('Slugs are unique without a lookup race', () => {
  it('gives two Posts with the same title distinct addresses', async () => {
    const a = await register('dupe@test.local');
    const first = await createPost(a);
    const second = await createPost(a);

    expect(first.body.slug).not.toBe(second.body.slug);
  });

  it('succeeds for two Posts created at the same moment', async () => {
    const a = await register('concurrent@test.local');

    const [first, second] = await Promise.all([
      createPost(a, { title: 'Simultaneous Headline' }),
      createPost(a, { title: 'Simultaneous Headline' }),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.slug).not.toBe(second.body.slug);
  });

  it('produces a usable address for a title of punctuation only', async () => {
    const a = await register('punct@test.local');
    const res = await createPost(a, { title: '!!! ??? ...' });
    expect(res.status).toBe(201);
    expect(res.body.slug.length).toBeGreaterThan(0);
  });

  it('produces a usable address for a non-Latin title', async () => {
    const a = await register('thai@test.local');
    const res = await createPost(a, { title: 'การเขียนบทความ' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('การเขียนบทความ');
  });
});
