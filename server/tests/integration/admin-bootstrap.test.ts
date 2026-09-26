import { describe, it, expect, beforeAll } from 'vitest';
import { PASSWORD, setupTestApp } from '../support/test-app';

const testApp = setupTestApp({ adminEmails: 'first@test.local, second@test.local' });
const { api } = testApp;

let User: typeof import('../../src/modules/auth/user.model').default;

beforeAll(async () => {
  User = (await import('../../src/modules/auth/user.model')).default;
});

const register = async (email: string) =>
  (await testApp.register(email)).body.user as { role: string };

async function signIn(email: string) {
  const res = await api().post('/api/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.user as { role: string };
}

describe('Admin status belongs to the database', () => {
  it('makes a listed email the first Admin when there is none', async () => {
    expect((await register('first@test.local')).role).toBe('admin');
  });

  it('gives a listed email nothing once an Admin exists', async () => {
    await register('first@test.local');
    expect((await register('second@test.local')).role).not.toBe('admin');
  });

  it('keeps a demoted Admin demoted on sign-in, though still listed', async () => {
    await register('first@test.local');
    await User.updateOne({ email: 'first@test.local' }, { $set: { role: 'creator' } });

    expect((await signIn('first@test.local')).role).not.toBe('admin');
    const stored = await User.findOne({ email: 'first@test.local' });
    expect(stored!.role).not.toBe('admin');
  });

  it('does not write to the account to reconcile Admin status on sign-in', async () => {
    await register('someone@test.local');
    await register('first@test.local');
    await User.updateOne({ email: 'first@test.local' }, { $set: { role: 'creator' } });
    const before = await User.findOne({ email: 'first@test.local' }).lean();

    await signIn('first@test.local');

    const after = await User.findOne({ email: 'first@test.local' }).lean();
    const ignoringSession = (doc: typeof after) => {
      const rest: Record<string, unknown> = { ...doc };
      delete rest.updatedAt;
      delete rest.failedLoginAttempts;
      return rest;
    };
    expect(ignoringSession(after)).toEqual(ignoringSession(before));
  });
});
