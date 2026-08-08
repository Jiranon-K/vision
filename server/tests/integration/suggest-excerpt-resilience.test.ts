import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
// Keep the timeout path fast to test without actually waiting on a real clock.
process.env.AI_SUGGESTION_TIMEOUT_MS = '50';

// The provider is mocked at the seam this repo owns (ADR 0003) rather than by
// spinning up a real network call — no test in this repo may reach a real
// provider.
const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }));
vi.mock('../../src/ai/provider', () => ({
  resolveGenerateText: () => generateTextMock,
  excerptSuggestionAvailable: () => true,
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
  generateTextMock.mockReset();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

describe('POST /api/posts/suggest-excerpt — degraded provider', () => {
  it('succeeds with the derived excerpt when the provider throws, and names it as the fallback', async () => {
    generateTextMock.mockRejectedValue(new Error('provider exploded'));
    const cookies = await register('throws@test.local');

    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content the provider fails to summarise.' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback');
    expect(typeof res.body.excerpt).toBe('string');
    expect(res.body.excerpt.length).toBeGreaterThan(0);
  });

  it('succeeds with the derived excerpt when the provider hangs past the timeout', async () => {
    generateTextMock.mockImplementation(() => new Promise(() => {})); // never resolves
    const cookies = await register('hangs@test.local');

    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content the provider never answers about.' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('fallback');
  });

  it('never reveals which provider backed a successful suggestion (ADR 0003)', async () => {
    generateTextMock.mockResolvedValue('A provider-made summary.');
    const cookies = await register('provider-name@test.local');

    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Content that succeeds.' });

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('provider');
    expect(JSON.stringify(res.body)).not.toMatch(/google|stub|gemini/i);
  });
});

describe('POST /api/posts/suggest-excerpt — validation before provider access', () => {
  it('rejects oversized content without ever calling the provider seam', async () => {
    generateTextMock.mockResolvedValue('should never be reached');
    const cookies = await register('oversized@test.local');

    const res = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'x'.repeat(50_001) });

    expect(res.status).toBe(400);
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
