import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
// A provider IS configured here — the point of this file is that createPost
// and updatePost never reach it regardless, which a stub-marker check on the
// output can't prove (a provider could echo mechanical-looking text back).
process.env.AI_PROVIDER = 'stub';

const { resolveGenerateTextSpy, suggestExcerptSpy } = vi.hoisted(() => ({
  resolveGenerateTextSpy: vi.fn(() => null),
  suggestExcerptSpy: vi.fn(),
}));

vi.mock('../../src/ai/provider', () => ({
  resolveGenerateText: resolveGenerateTextSpy,
  excerptSuggestionAvailable: () => false,
}));
vi.mock('../../src/ai/excerptSuggestion', () => ({
  suggestExcerpt: suggestExcerptSpy,
}));

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
  resolveGenerateTextSpy.mockClear();
  suggestExcerptSpy.mockClear();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

// ADR 0002: a provider must never sit on the save/publish path — that would
// make publishing depend on a third party being up. The tempting change is
// to call the provider while saving so the excerpt is always good; this
// spies directly on the seam (ADR 0003) that change would have to go
// through, so it fails the moment createPost/updatePost start calling it,
// no matter what the provider returns.
describe('save path stays provider-free (ADR 0002)', () => {
  it('createPost reaches neither resolveGenerateText nor suggestExcerpt', async () => {
    const cookies = await register('create-provider-free@test.local');
    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'A post',
        content: 'Content for a post that must not touch a provider.',
        category: 'SEO',
        status: 'Draft',
      });

    expect(res.status).toBe(201);
    expect(resolveGenerateTextSpy).not.toHaveBeenCalled();
    expect(suggestExcerptSpy).not.toHaveBeenCalled();
  });

  it('updatePost reaches neither resolveGenerateText nor suggestExcerpt', async () => {
    const cookies = await register('update-provider-free@test.local');
    const createRes = await request(app)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'A post to update',
        content: 'Original content.',
        category: 'SEO',
        status: 'Draft',
      });
    expect(createRes.status).toBe(201);
    resolveGenerateTextSpy.mockClear();
    suggestExcerptSpy.mockClear();

    const res = await request(app)
      .put(`/api/posts/${createRes.body._id}`)
      .set('Cookie', cookies)
      .send({ content: 'Updated content that would need a new excerpt.' });

    expect(res.status).toBe(200);
    expect(resolveGenerateTextSpy).not.toHaveBeenCalled();
    expect(suggestExcerptSpy).not.toHaveBeenCalled();
  });
});
