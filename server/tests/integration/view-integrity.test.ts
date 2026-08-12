import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';

let mongo: MongoMemoryServer;
let app: import('express').Express;
let ViewRecord: typeof import('../../src/models/ViewRecord').default;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  ViewRecord = (await import('../../src/models/ViewRecord')).default;
  await ViewRecord.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
  await ViewRecord.syncIndexes();
});

const PW = 'Aa1!aaaa';
const READER = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const OTHER_READER =
  'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/121 Safari/537.36';

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

const recordView = (id: string, agent = READER) =>
  request(app)
    .post(`/api/posts/${id}/view`)
    .set('User-Agent', agent)
    .set('Accept-Language', 'en-GB');

async function viewsOf(id: string): Promise<number> {
  const res = await request(app).get(`/api/posts/${id}`);
  return res.body.views as number;
}

describe('A View means one Reader read it', () => {
  it('counts one recording', async () => {
    const a = await register('view-one@test.local');
    const post = await createPost(a);

    await recordView(post).expect(204);

    expect(await viewsOf(post)).toBe(1);
  });

  it('ignores a repeat from the same Reader inside the window', async () => {
    const a = await register('view-repeat@test.local');
    const post = await createPost(a);

    await recordView(post).expect(204);
    await recordView(post).expect(204);
    await recordView(post).expect(204);

    expect(await viewsOf(post)).toBe(1);
  });

  it('counts a different Reader inside the window', async () => {
    const a = await register('view-two@test.local');
    const post = await createPost(a);

    await recordView(post).expect(204);
    await recordView(post, OTHER_READER).expect(204);

    expect(await viewsOf(post)).toBe(2);
  });

  it('counts the same Reader again once the window has passed', async () => {
    const a = await register('view-window@test.local');
    const post = await createPost(a);

    await recordView(post).expect(204);
    // The window is expressed as a row that expires; removing it is what
    // "the window passed" means to everything downstream.
    await ViewRecord.deleteMany({});
    await recordView(post).expect(204);

    expect(await viewsOf(post)).toBe(2);
  });

  it('counts the same Reader separately on a different Post', async () => {
    const a = await register('view-perpost@test.local');
    const first = await createPost(a);
    const second = await createPost(a);

    await recordView(first).expect(204);
    await recordView(second).expect(204);

    expect(await viewsOf(first)).toBe(1);
    expect(await viewsOf(second)).toBe(1);
  });
});

describe('What does not count', () => {
  it('does not count a Draft', async () => {
    const a = await register('view-draft@test.local');
    const draft = await createPost(a, { status: 'Draft' });

    await recordView(draft).expect(204);

    const res = await request(app).get(`/api/posts/${draft}`).set('Cookie', a);
    expect(res.body.views).toBe(0);
  });

  it('does not count a known crawler', async () => {
    const a = await register('view-crawler@test.local');
    const post = await createPost(a);

    await recordView(post, 'Googlebot/2.1 (+http://www.google.com/bot.html)').expect(204);

    expect(await viewsOf(post)).toBe(0);
  });

  it('does not count a request with no user agent', async () => {
    const a = await register('view-noagent@test.local');
    const post = await createPost(a);

    await request(app).post(`/api/posts/${post}/view`).set('User-Agent', '').expect(204);

    expect(await viewsOf(post)).toBe(0);
  });
});

describe('Bad identifiers are the caller’s mistake', () => {
  it('answers a malformed id as a client error', async () => {
    const res = await recordView('not-an-object-id');
    expect(res.status).toBe(400);
  });

  it('answers an unknown id as not found', async () => {
    const res = await recordView(new mongoose.Types.ObjectId().toString());
    expect(res.status).toBe(404);
  });
});

describe('Deleting a Post takes its Views with it', () => {
  it('leaves nothing behind in the Creator’s totals', async () => {
    const a = await register('view-delete@test.local');
    const post = await createPost(a);
    await recordView(post).expect(204);

    await request(app).delete(`/api/posts/${post}`).set('Cookie', a).expect(200);

    const stats = await request(app).get('/api/analytics').set('Cookie', a);
    expect(stats.body.find((s: { label: string }) => s.label === 'Total Views')?.value).toBe('0');
    expect(await ViewRecord.countDocuments({})).toBe(0);
  });
});
