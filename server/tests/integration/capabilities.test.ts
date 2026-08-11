import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';
// No AI_PROVIDER, no GOOGLE_GENERATIVE_AI_API_KEY — this file asserts the
// no-credentials case, so it must not inherit either from the environment.
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
  await mongoose.disconnect();
  await mongo.stop();
});

describe('GET /api/capabilities', () => {
  it('reports excerptSuggestion as unavailable with no provider configured', async () => {
    const res = await request(app).get('/api/capabilities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ excerptSuggestion: false });
  });

  it('requires no authentication', async () => {
    const res = await request(app).get('/api/capabilities');
    expect(res.status).not.toBe(401);
  });
});

describe('POST /api/posts/suggest-excerpt with no provider configured', () => {
  it('reports the capability unavailable (503) rather than reaching a provider', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noprovider@test.local', password: 'Aa1!aaaa', name: 'noprovider@test.local' });
    expect(res.status).toBe(201);
    const cookies = res.headers['set-cookie'] as unknown as string[];

    const suggestRes = await request(app)
      .post('/api/posts/suggest-excerpt')
      .set('Cookie', cookies)
      .send({ content: 'Some content.' });
    expect(suggestRes.status).toBe(503);
  });
});
