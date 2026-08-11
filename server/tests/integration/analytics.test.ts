import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';

let mongo: MongoMemoryServer;
let app: import('express').Express;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
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
): Promise<string> {
  const res = await request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: `Post ${Math.random()}`,
      content: 'hello world content here',
      category: 'SEO',
      status: 'Published',
      ...body,
    });
  expect(res.status).toBe(201);
  return res.body._id as string;
}

async function view(id: string, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    const res = await request(app).post(`/api/posts/${id}/view`);
    expect(res.status).toBe(204);
  }
}

function statValue(body: { label: string; value: string }[], label: string) {
  return body.find((s) => s.label === label)?.value;
}

describe('Growth Analytics is scoped to one Creator', () => {
  it('refuses an unauthenticated caller on both routes', async () => {
    expect((await request(app).get('/api/analytics')).status).toBe(401);
    expect((await request(app).get('/api/analytics/views')).status).toBe(401);
  });

  it('counts only the calling Creator’s Views and Posts', async () => {
    const a = await register('stats-a@test.local');
    const aPost = await createPost(a);
    await view(aPost, 3);

    const b = await register('stats-b@test.local');
    const bPost = await createPost(b);
    await view(bPost, 10);
    await createPost(b);

    const res = await request(app).get('/api/analytics').set('Cookie', a);
    expect(res.status).toBe(200);
    expect(statValue(res.body, 'Total Views')).toBe('3');
    expect(statValue(res.body, 'Posts')).toBe('1');
  });

  it('reports zeroes for a Creator with no Posts', async () => {
    const a = await register('stats-empty@test.local');

    const res = await request(app).get('/api/analytics').set('Cookie', a);
    expect(res.status).toBe(200);
    expect(statValue(res.body, 'Total Views')).toBe('0');
    expect(statValue(res.body, 'Posts')).toBe('0');
  });

  it('excludes Draft Views from Total Views but counts the Draft as a Post', async () => {
    const a = await register('stats-draft@test.local');
    const draft = await createPost(a, { status: 'Draft' });
    await request(app).post(`/api/posts/${draft}/view`);

    const res = await request(app).get('/api/analytics').set('Cookie', a);
    expect(statValue(res.body, 'Total Views')).toBe('0');
    expect(statValue(res.body, 'Posts')).toBe('1');
  });

  it('reports no metric it cannot attribute to the Creator', async () => {
    const a = await register('stats-labels@test.local');
    const res = await request(app).get('/api/analytics').set('Cookie', a);

    const labels = res.body.map((s: { label: string }) => s.label);
    expect(labels).toEqual(['Total Views', 'Posts']);
  });

  it('removes a deleted Post’s Views from the totals', async () => {
    const a = await register('stats-delete@test.local');
    const keep = await createPost(a);
    const drop = await createPost(a);
    await view(keep, 2);
    await view(drop, 5);

    await request(app).delete(`/api/posts/${drop}`).set('Cookie', a).expect(200);

    const res = await request(app).get('/api/analytics').set('Cookie', a);
    expect(statValue(res.body, 'Total Views')).toBe('2');
    expect(statValue(res.body, 'Posts')).toBe('1');
  });

  it('agrees with the Creator’s own Posts list', async () => {
    const a = await register('stats-agree@test.local');
    await createPost(a);
    await createPost(a, { status: 'Draft' });

    const list = await request(app).get('/api/posts').set('Cookie', a);
    const stats = await request(app).get('/api/analytics').set('Cookie', a);

    expect(statValue(stats.body, 'Posts')).toBe(String(list.body.length));
  });
});

describe('The weekly View trend is the Creator’s own', () => {
  it('returns one point per day for seven days', async () => {
    const a = await register('trend-shape@test.local');

    const res = await request(app).get('/api/analytics/views').set('Cookie', a);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
    for (const point of res.body) {
      expect(typeof point.label).toBe('string');
      expect(point.value).toBe(0);
    }
  });

  it('counts today’s Views on the Creator’s own Posts only', async () => {
    const a = await register('trend-a@test.local');
    const aPost = await createPost(a);
    await view(aPost, 2);

    const b = await register('trend-b@test.local');
    const bPost = await createPost(b);
    await view(bPost, 7);

    const res = await request(app).get('/api/analytics/views').set('Cookie', a);
    expect(res.body[res.body.length - 1].value).toBe(2);
    expect(res.body.reduce((sum: number, p: { value: number }) => sum + p.value, 0)).toBe(2);
  });

  it('drops a deleted Post’s Views out of the trend', async () => {
    const a = await register('trend-delete@test.local');
    const post = await createPost(a);
    await view(post, 4);

    await request(app).delete(`/api/posts/${post}`).set('Cookie', a).expect(200);

    const res = await request(app).get('/api/analytics/views').set('Cookie', a);
    expect(res.body.reduce((sum: number, p: { value: number }) => sum + p.value, 0)).toBe(0);
  });
});
