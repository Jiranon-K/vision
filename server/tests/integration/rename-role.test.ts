import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { setupTestApp } from '../support/testApp';

const { register } = setupTestApp();

let renameRole: typeof import('../../src/migrations/renameRole').renameRole;

beforeAll(async () => {
  ({ renameRole } = await import('../../src/migrations/renameRole'));
});

const RETIRED_ROLE = 'retired-role';

const users = () => mongoose.connection.db!.collection('users');
const storeRole = (email: string, role: string) =>
  users().updateOne({ email }, { $set: { role } });
const storedRole = async (email: string) => (await users().findOne({ email }))!.role;

describe('The role migration', () => {
  it('moves every record holding one value to another, and nothing else', async () => {
    await register('a@test.local');
    await register('b@test.local');
    await storeRole('a@test.local', RETIRED_ROLE);
    await storeRole('b@test.local', 'admin');

    expect(await renameRole(RETIRED_ROLE, 'creator')).toBe(1);
    expect(await storedRole('a@test.local')).toBe('creator');
    expect(await storedRole('b@test.local')).toBe('admin');
  });

  it('can be run again without harm', async () => {
    await register('a@test.local');
    await storeRole('a@test.local', RETIRED_ROLE);

    await renameRole(RETIRED_ROLE, 'creator');
    expect(await renameRole(RETIRED_ROLE, 'creator')).toBe(0);
  });

  it('runs backwards by swapping its arguments', async () => {
    await register('a@test.local');
    await register('b@test.local');
    await storeRole('b@test.local', 'admin');

    expect(await renameRole('creator', RETIRED_ROLE)).toBe(1);
    expect(await storedRole('a@test.local')).toBe(RETIRED_ROLE);
    expect(await storedRole('b@test.local')).toBe('admin');

    await renameRole(RETIRED_ROLE, 'creator');
    expect(await storedRole('a@test.local')).toBe('creator');
  });
});
