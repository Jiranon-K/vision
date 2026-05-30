import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
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

function createPost(
  cookies: string[],
  body: Record<string, unknown> = {}
) {
  return request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: 'My Post',
      content: 'hello world content here',
      category: 'SEO',
      status: 'Draft',
      ...body,
    });
}

describe('Post ownership authorization', () => {
  it('sets owner + author on create and stamps role', async () => {
    const author = await register('author@test.local');
    const res = await createPost(author);
    expect(res.status).toBe(201);
    expect(res.body.owner).toBeTruthy();
    expect(res.body.author.role).toBe('Author');
  });

  it('marks an admin-created post author.role as Admin', async () => {
    const admin = await register('admin@test.local');
    const res = await createPost(admin);
    expect(res.status).toBe(201);
    expect(res.body.author.role).toBe('Admin');
  });

  it('blocks a non-owner author from editing or deleting (403)', async () => {
    const a = await register('a@test.local');
    const created = await createPost(a);
    const id = created.body._id;

    const b = await register('b@test.local');
    const put = await request(app)
      .put(`/api/posts/${id}`)
      .set('Cookie', b)
      .send({ title: 'Hijacked' });
    expect(put.status).toBe(403);

    const del = await request(app)
      .delete(`/api/posts/${id}`)
      .set('Cookie', b);
    expect(del.status).toBe(403);
  });

  it('lets the owner edit their own post', async () => {
    const a = await register('owner@test.local');
    const created = await createPost(a);
    const id = created.body._id;

    const put = await request(app)
      .put(`/api/posts/${id}`)
      .set('Cookie', a)
      .send({ title: 'Updated Title' });
    expect(put.status).toBe(200);
    expect(put.body.title).toBe('Updated Title');
  });

  it('lets an admin edit any post', async () => {
    const a = await register('someone@test.local');
    const created = await createPost(a);
    const id = created.body._id;

    const admin = await register('admin@test.local');
    const put = await request(app)
      .put(`/api/posts/${id}`)
      .set('Cookie', admin)
      .send({ title: 'Admin Edit' });
    expect(put.status).toBe(200);
    expect(put.body.title).toBe('Admin Edit');
  });
});

describe('Draft visibility for anonymous callers', () => {
  it('excludes drafts from the public list', async () => {
    const a = await register('writer@test.local');
    await createPost(a, { status: 'Draft' });
    await createPost(a, { status: 'Published', title: 'Live' });

    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('Published');
  });

  it('returns 404 for a draft fetched by id without auth', async () => {
    const a = await register('writer2@test.local');
    const draft = await createPost(a, { status: 'Draft' });
    const pub = await createPost(a, { status: 'Published', title: 'Live2' });

    const anonDraft = await request(app).get(`/api/posts/${draft.body._id}`);
    expect(anonDraft.status).toBe(404);

    const anonPub = await request(app).get(`/api/posts/${pub.body._id}`);
    expect(anonPub.status).toBe(200);
  });

  it('lets the authenticated owner fetch their own draft by id', async () => {
    const a = await register('writer3@test.local');
    const draft = await createPost(a, { status: 'Draft' });
    const res = await request(app)
      .get(`/api/posts/${draft.body._id}`)
      .set('Cookie', a);
    expect(res.status).toBe(200);
  });
});

describe('Server-derived excerpt + readTime', () => {
  it('auto-derives a non-empty excerpt when none is provided', async () => {
    const a = await register('exc@test.local');
    const res = await createPost(a, { excerpt: '' });
    expect(res.status).toBe(201);
    expect(typeof res.body.excerpt).toBe('string');
    expect(res.body.excerpt.length).toBeGreaterThan(0);
    expect(res.body.readTime).toMatch(/^\d+ min read$/);
  });

  it('does not 500 when content strips to empty markdown with a blank excerpt', async () => {
    const a = await register('exc2@test.local');
    const res = await createPost(a, { content: '#   ', excerpt: '' });
    expect(res.status).toBe(201);
    expect(res.body.excerpt.length).toBeGreaterThan(0);
  });

  it('ignores any client-supplied readTime and computes its own', async () => {
    const a = await register('exc3@test.local');
    const res = await createPost(a, { readTime: '999 min read' });
    expect(res.status).toBe(201);
    expect(res.body.readTime).not.toBe('999 min read');
  });
});
