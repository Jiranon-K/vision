import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

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

// ADR 0002: createPost/updatePost must reach no provider, even when one is
// configured (AI_PROVIDER=stub is set for this whole file).
describe('save path stays provider-free (ADR 0002)', () => {
  it('derives the excerpt mechanically on create, never via the provider seam', async () => {
    const cookies = await register('savepath@test.local');
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'Provider-free save',
        content: 'Content for a post saved with a provider configured.',
        category: 'SEO',
        status: 'Draft',
        excerpt: '',
      });

    expect(res.status).toBe(201);
    // The stub provider always prefixes with this marker — its absence shows
    // deriveExcerpt (not suggestExcerpt) produced the excerpt.
    expect(res.body.excerpt).not.toMatch(/^Stub excerpt suggestion:/);
  });
});
