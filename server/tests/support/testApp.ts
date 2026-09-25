import { afterAll, beforeAll, beforeEach, expect } from 'vitest';
import mongoose, { type ConnectOptions } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { Express } from 'express';

export const PASSWORD = 'Aa1!aaaa';

interface TestAppOptions {
  adminEmails?: string;
  connect?: ConnectOptions;
  syncIndexes?: boolean;
}

export function setupTestApp({
  adminEmails,
  connect,
  syncIndexes = false,
}: TestAppOptions = {}) {
  process.env['NODE_ENV'] = 'test';
  process.env.JWT_SECRET = 'integration-test-secret';
  process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';
  if (adminEmails !== undefined) process.env.ADMIN_EMAILS = adminEmails;

  let mongo: MongoMemoryServer;
  let app: Express;

  const syncPostIndexes = async () => {
    if (!syncIndexes) return;
    await (await import('../../src/modules/posts/post.model')).default.syncIndexes();
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    await mongoose.connect(process.env.MONGODB_URI, connect);
    app = (await import('../../src/index')).app;
    await syncPostIndexes();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    for (const c of await mongoose.connection.db!.collections()) {
      await c.deleteMany({});
    }
    await syncPostIndexes();
  });

  const api = () => request(app);

  const register = async (email: string, name = email) => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email, password: PASSWORD, name });
    expect(res.status).toBe(201);
    return res;
  };

  return { api, register };
}

export const cookiesOf = (res: request.Response): string[] =>
  res.headers['set-cookie'] as unknown as string[];
