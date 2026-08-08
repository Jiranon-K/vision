import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import ExcerptSuggestion from '../../src/models/ExcerptSuggestion';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.ADMIN_EMAILS = 'admin@test.local';
// Deterministic fake provider — no network call, exercises the real route.
process.env.AI_PROVIDER = 'stub';
delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

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

describe('POST /api/posts/suggest-excerpt', () => {
  it('returns a provider-produced suggestion for an authenticated request', async () => {
    const cookies = await register('suggest@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Some Post content worth summarising.' });

    expect(res.status).toBe(200);
    expect(typeof res.body.excerpt).toBe('string');
    expect(res.body.excerpt.length).toBeGreaterThan(0);
    expect(res.body.source).toBe('provider');
  });

  it('does not require a Post id — content alone is enough', async () => {
    const cookies = await register('nopost@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content for a Post that was never saved.' });
    expect(res.status).toBe(200);
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .send({ content: 'Some content.' });
    expect(res.status).toBe(401);
  });

  it('rejects empty content with the {field,message} shape', async () => {
    const cookies = await register('empty@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'content', message: expect.any(String) }),
      ])
    );
  });

  it('rejects content beyond the ceiling with the {field,message} shape', async () => {
    const cookies = await register('toolong@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'x'.repeat(50_001) });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'content', message: expect.any(String) }),
      ])
    );
  });
});

describe('POST /api/posts/suggest-excerpt — recording usage', () => {
  it('records an issued suggestion with no Post id when the Post was never saved', async () => {
    const cookies = await register('record-nopost@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content for a Post that was never saved.' });
    expect(res.status).toBe(200);

    const records = await ExcerptSuggestion.find({});
    expect(records).toHaveLength(1);
    expect(records[0].post).toBeUndefined();
    expect(records[0].text).toBe(res.body.excerpt);
    expect(records[0].source).toBe('provider');
    expect(records[0].creator).toBeDefined();
  });

  it('attributes the recorded suggestion to the Post id when one is supplied', async () => {
    const cookies = await register('record-withpost@test.local');
    const postId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content for an already-saved Post.', postId });
    expect(res.status).toBe(200);

    const records = await ExcerptSuggestion.find({});
    expect(records).toHaveLength(1);
    expect(String(records[0].post)).toBe(postId);
  });

  // Without this, the common flow — write a new Post, ask for a suggestion,
  // then save — leaves every record unattributed, and both thresholds in
  // docs/excerpt-suggestion-metrics.md read near zero however many Creators
  // used the button.
  it('claims a suggestion issued before the Post existed once that Creator creates one', async () => {
    const cookies = await register('record-orphan@test.local');
    const suggestRes = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content drafted before the Post was ever saved.' });
    expect(suggestRes.status).toBe(200);

    const createRes = await request(app)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'A Post created after asking',
        content: 'Content drafted before the Post was ever saved.',
        category: 'SEO',
        status: 'Published',
      });
    expect(createRes.status).toBe(201);

    const records = await ExcerptSuggestion.find({});
    expect(records).toHaveLength(1);
    expect(String(records[0].post)).toBe(String(createRes.body._id));
  });

  it('does not claim another Creator\'s unattributed suggestion', async () => {
    const asker = await register('record-asker@test.local');
    await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', asker)
      .send({ content: 'Content belonging to the Creator who asked.' });

    const other = await register('record-other@test.local');
    const createRes = await request(app)
      .post('/api/posts')
      .set('Cookie', other)
      .send({
        title: 'An unrelated Post',
        content: 'Written by someone else entirely.',
        category: 'SEO',
        status: 'Published',
      });
    expect(createRes.status).toBe(201);

    const records = await ExcerptSuggestion.find({});
    expect(records).toHaveLength(1);
    expect(records[0].post).toBeUndefined();
  });

  it('rejects a malformed postId with the {field,message} shape', async () => {
    const cookies = await register('record-badpost@test.local');
    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Some content.', postId: 'not-an-id' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'postId', message: expect.any(String) }),
      ])
    );
  });
});

// The stronger ADR 0002 regression — spying on the provider seam itself and
// asserting zero calls from createPost/updatePost — lives in
// save-path-provider-free.test.ts. It needs the seam mocked before the app
// module graph loads, which this file's AI_PROVIDER=stub setup does not do.
