import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';
process.env.ADMIN_EMAILS = 'admin@test.local';

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

async function createPost(cookies: string[], title: string): Promise<void> {
  const res = await request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title,
      content: 'hello world content here',
      category: 'SEO',
      status: 'Published',
    });
  expect(res.status).toBe(201);
}

async function seed(): Promise<string[]> {
  const cookies = await register('search@test.local');
  await createPost(cookies, 'Learning C++ Basics');
  await createPost(cookies, 'Regex .* Cheatsheet');
  await createPost(cookies, 'Marketing Fundamentals');
  return cookies;
}

// The Hub list is the Creator's own, so a search narrows inside that constraint
// rather than across the platform.
function search(term: string, cookies: string[]) {
  return request(app)
    .get('/api/posts')
    .set('Cookie', cookies)
    .query({ search: term });
}

describe('Post search treats the term as literal text', () => {
  it('matches a term containing regex metacharacters instead of erroring', async () => {
    const cookies = await seed();

    const res = await search('c++', cookies);

    expect(res.status).toBe(200);
    expect(res.body.map((p: { title: string }) => p.title)).toEqual([
      'Learning C++ Basics',
    ]);
  });

  it('does not let a wildcard term match every post', async () => {
    const cookies = await seed();

    const res = await search('.*', cookies);

    expect(res.status).toBe(200);
    expect(res.body.map((p: { title: string }) => p.title)).toEqual([
      'Regex .* Cheatsheet',
    ]);
  });

  it('keeps case-insensitive substring matching', async () => {
    const cookies = await seed();

    const res = await search('basics', cookies);

    expect(res.status).toBe(200);
    expect(res.body.map((p: { title: string }) => p.title)).toEqual([
      'Learning C++ Basics',
    ]);
  });
});
