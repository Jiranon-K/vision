import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { PASSWORD, cookiesOf, setupTestApp } from '../support/testApp';

const { api, register } = setupTestApp();

let User: typeof import('../../src/models/User').default;
let ROLES: typeof import('../../src/authz/roles').ROLES;

const RETIRED_ROLE = 'retired-role';

beforeAll(async () => {
  User = (await import('../../src/models/User')).default;
  ({ ROLES } = await import('../../src/authz/roles'));
});

const storeRole = (email: string, role: string) =>
  mongoose.connection.db!.collection('users').updateOne({ email }, { $set: { role } });

describe('The stored role accepts only the two current values', () => {
  it('is exactly admin and creator', () => {
    expect([...ROLES]).toEqual(['admin', 'creator']);
  });

  it('is enforced at the schema', async () => {
    const user = new User({ email: 'x@test.local', password: PASSWORD, role: RETIRED_ROLE });
    await expect(user.validate()).rejects.toThrow(/role/);
    await expect(
      new User({ email: 'y@test.local', password: PASSWORD, role: 'creator' }).validate()
    ).resolves.toBeUndefined();
  });
});

describe('A record holding any other value is rejected, not accepted', () => {
  it('refuses to sign it in, and issues no session', async () => {
    await register('stale@test.local');
    await storeRole('stale@test.local', RETIRED_ROLE);

    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'stale@test.local', password: PASSWORD });
    expect(res.status).toBe(401);
    const cookies = (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
    for (const name of ['access_token', 'refresh_token']) {
      const issued = cookies.find((c) => c.startsWith(`${name}=`));
      expect(issued === undefined || issued.startsWith(`${name}=;`), name).toBe(true);
    }
    const stored = await mongoose.connection
      .db!.collection('users')
      .findOne({ email: 'stale@test.local' });
    expect(stored!.sessions ?? []).toHaveLength(1);
  });

  it('refuses to refresh its session', async () => {
    const reg = await register('stale-refresh@test.local');
    await storeRole('stale-refresh@test.local', RETIRED_ROLE);

    const res = await api()
      .post('/api/auth/refresh')
      .set('Cookie', cookiesOf(reg));
    expect(res.status).toBe(401);
  });

  it('refuses a token carrying it', async () => {
    const reg = await register('stale-token@test.local');
    const token = jwt.sign(
      { id: reg.body.user.id, email: 'stale-token@test.local', name: 'x', role: RETIRED_ROLE },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const hub = await api().get('/api/posts').set('Authorization', `Bearer ${token}`);
    expect(hub.status).toBe(401);
    const created = await api()
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 't', content: 'c', category: 'SEO', status: 'Draft' });
    expect(created.status).toBe(401);
  });

  it('still signs in a Creator stored with the current value', async () => {
    await register('fine@test.local');
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'fine@test.local', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('creator');
  });
});
