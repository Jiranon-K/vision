import { MongoClient } from 'mongodb';
import { E2E_MONGODB_URI } from './config';

function databaseName(uri: string): string {
  // new URL() on a mongodb:// URI gives pathname "/<db>" (plus any options).
  const path = new URL(uri).pathname.replace(/^\//, '');
  return path.split('?')[0];
}

export default async function globalSetup() {
  const dbName = databaseName(E2E_MONGODB_URI);

  // Refuse to touch anything that isn't unmistakably an E2E database. A wipe
  // helper without this guard is how people lose their development data.
  if (!dbName.endsWith('_e2e')) {
    throw new Error(
      `Refusing to run E2E against database "${dbName}": the name must end in "_e2e". ` +
        `Check E2E_MONGODB_URI (got ${E2E_MONGODB_URI}).`
    );
  }

  const client = new MongoClient(E2E_MONGODB_URI);
  await client.connect();
  await client.db(dbName).dropDatabase();
  await client.close();
}
