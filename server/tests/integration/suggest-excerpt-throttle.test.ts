import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
delete process.env.AI_PROVIDER;
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
  process.env['NODE_ENV'] = 'test';
  await mongoose.disconnect();
  await mongo.stop();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

describe('POST /api/posts/suggest-excerpt — per-Creator throttle', () => {
  it('reports 429 once the hourly budget for one Creator is spent', async () => {
    const cookies = await register('throttled@test.local');

    // Rate limiting is skipped whenever NODE_ENV=test (so unrelated
    // integration tests don't share the in-memory counters) — flip it off
    // only for this exercise, and always restore it afterwards.
    process.env['NODE_ENV'] = 'throttle-check';
    try {
      let last;
      for (let i = 0; i < 21; i++) {
        last = await request(app)
          .post('/api/posts/suggest-excerpt')
          .set('Cookie', cookies)
          .send({ content: 'Content for a throttle check.' });
      }
      expect(last!.status).toBe(429);
      expect(last!.body.error).toMatch(/too many/i);
    } finally {
      process.env['NODE_ENV'] = 'test';
    }
  });
});
