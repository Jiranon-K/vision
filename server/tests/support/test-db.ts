import { afterAll, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// An in-memory database for tests that call a module's functions directly,
// without the HTTP app. Every collection is emptied before each test and
// the indexes are rebuilt, because Slugs and search depend on them.
export function setupTestDb() {
  // Module entry files load the session middleware, which reads these at import.
  process.env['NODE_ENV'] = 'test';
  process.env.JWT_SECRET ??= 'unit-test-secret';
  process.env.JWT_REFRESH_SECRET ??= 'unit-test-secret-refresh';

  let mongo: MongoMemoryServer;

  const syncIndexes = async () => {
    for (const model of Object.values(mongoose.models)) {
      await model.syncIndexes();
    }
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    for (const c of await mongoose.connection.db!.collections()) {
      await c.deleteMany({});
    }
    await syncIndexes();
  });
}
