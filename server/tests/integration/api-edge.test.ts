import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';

let mongo: MongoMemoryServer;
let app: import('express').Express;
let Post: typeof import('../../src/models/Post').default;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  Post = (await import('../../src/models/Post')).default;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

describe('Unmatched routes', () => {
  it('answers as JSON rather than an HTML error page', async () => {
    const res = await request(app).get('/api/not-a-route');
    expect(res.status).toBe(404);
    expect(res.type).toBe('application/json');
    expect(typeof res.body.error).toBe('string');
  });

  it('is distinguishable from a known route reporting a missing record', async () => {
    const unknownRoute = await request(app).get('/api/nope');
    const missingPost = await request(app).get(
      `/api/posts/${new mongoose.Types.ObjectId()}`
    );

    expect(unknownRoute.status).toBe(404);
    expect(missingPost.status).toBe(404);
    expect(unknownRoute.body.error).not.toBe(missingPost.body.error);
  });
});

describe('Unhandled failures', () => {
  it('answers in the standard shape and leaks no internal detail', async () => {
    const cookies = await register('edge-throw@test.local');
    vi.spyOn(Post, 'find').mockImplementation(() => {
      throw new Error('a very internal secret detail');
    });

    const res = await request(app).get('/api/posts').set('Cookie', cookies);
    expect(res.status).toBe(500);
    expect(res.type).toBe('application/json');
    expect(JSON.stringify(res.body)).not.toContain('a very internal secret');
    expect(JSON.stringify(res.body)).not.toContain('at ');
  });

  it('carries a correlation identifier the caller can quote', async () => {
    const cookies = await register('edge-correlate@test.local');
    vi.spyOn(Post, 'find').mockImplementation(() => {
      throw new Error('boom');
    });

    const res = await request(app).get('/api/posts').set('Cookie', cookies);
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });

  it('honours a correlation identifier supplied upstream', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('X-Request-Id', 'upstream-value');
    expect(res.headers['x-request-id']).toBe('upstream-value');
  });
});

describe('Malformed and invalid input', () => {
  it('answers a malformed JSON body as a client error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.type).toBe('application/json');
  });

  it('keeps the field-level shape the forms consume', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'x', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toHaveProperty('field');
    expect(res.body.details[0]).toHaveProperty('message');
  });
});

describe('Security headers', () => {
  const assertHeaders = (headers: Record<string, string | undefined>) => {
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']?.toUpperCase()).toBe('DENY');
    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['x-powered-by']).toBeUndefined();
  };

  it('are present on a successful response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    assertHeaders(res.headers);
  });

  it('are present on a failing response', async () => {
    const res = await request(app).get('/api/not-a-route');
    expect(res.status).toBe(404);
    assertHeaders(res.headers);
  });
});
