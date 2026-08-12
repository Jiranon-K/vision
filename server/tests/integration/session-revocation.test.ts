import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';

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
});

const PW = 'Aa1!aaaa';
const NEW_PW = 'Bb2@bbbb';

async function registerCreator(email: string): Promise<void> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
}

// A cookie jar per simulated device: signing in twice is what makes the
// "leave my other device alone" cases meaningful.
async function signIn(email: string, password = PW): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(res.status).toBe(200);
  return res.headers['set-cookie'] as unknown as string[];
}

const refreshWith = (cookies: string[]) =>
  request(app).post('/api/auth/refresh').set('Cookie', cookies);

function cookieValue(cookies: string[], name: string): string {
  const found = cookies.find((c) => c.startsWith(`${name}=`));
  return found ? found.split('=')[1].split(';')[0] : '';
}

describe('Signing out ends the session', () => {
  it('refuses a refresh token that was signed out', async () => {
    await registerCreator('signout@test.local');
    const device = await signIn('signout@test.local');

    expect((await refreshWith(device)).status).toBe(200);

    await request(app).post('/api/auth/logout').set('Cookie', device).expect(200);

    expect((await refreshWith(device)).status).toBe(401);
  });

  it('leaves the Creator’s other device signed in', async () => {
    await registerCreator('twodevices@test.local');
    const laptop = await signIn('twodevices@test.local');
    const phone = await signIn('twodevices@test.local');

    await request(app).post('/api/auth/logout').set('Cookie', laptop).expect(200);

    expect((await refreshWith(laptop)).status).toBe(401);
    expect((await refreshWith(phone)).status).toBe(200);
  });

  it('keeps both devices working when neither has signed out', async () => {
    await registerCreator('bothalive@test.local');
    const laptop = await signIn('bothalive@test.local');
    const phone = await signIn('bothalive@test.local');

    expect((await refreshWith(laptop)).status).toBe(200);
    expect((await refreshWith(phone)).status).toBe(200);
  });

  it('clears the cookies when a refresh is refused', async () => {
    await registerCreator('cleared@test.local');
    const device = await signIn('cleared@test.local');
    await request(app).post('/api/auth/logout').set('Cookie', device);

    const res = await refreshWith(device);
    const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
    expect(setCookie.join(';')).toContain('refresh_token=;');
  });
});

describe('Signing out everywhere', () => {
  it('refuses every device', async () => {
    await registerCreator('everywhere@test.local');
    const laptop = await signIn('everywhere@test.local');
    const phone = await signIn('everywhere@test.local');

    await request(app)
      .post('/api/auth/logout-everywhere')
      .set('Cookie', laptop)
      .expect(200);

    expect((await refreshWith(laptop)).status).toBe(401);
    expect((await refreshWith(phone)).status).toBe(401);
  });

  it('leaves another Creator’s sessions intact', async () => {
    await registerCreator('mine@test.local');
    await registerCreator('theirs@test.local');
    const mine = await signIn('mine@test.local');
    const theirs = await signIn('theirs@test.local');

    await request(app)
      .post('/api/auth/logout-everywhere')
      .set('Cookie', mine)
      .expect(200);

    expect((await refreshWith(theirs)).status).toBe(200);
  });

  it('refuses an unauthenticated caller', async () => {
    const res = await request(app).post('/api/auth/logout-everywhere');
    expect(res.status).toBe(401);
  });
});

describe('Changing a password', () => {
  it('refuses the other device and keeps the changing one signed in', async () => {
    await registerCreator('changer@test.local');
    const laptop = await signIn('changer@test.local');
    const phone = await signIn('changer@test.local');

    const changed = await request(app)
      .put('/api/settings/password')
      .set('Cookie', laptop)
      .send({ currentPassword: PW, newPassword: NEW_PW });
    expect(changed.status).toBe(200);

    expect((await refreshWith(phone)).status).toBe(401);

    // The changing device is re-issued, so it continues with its new cookies.
    const reissued = changed.headers['set-cookie'] as unknown as string[];
    expect((await refreshWith(reissued)).status).toBe(200);
  });
});

describe('Resetting a password', () => {
  it('refuses every device', async () => {
    await registerCreator('resetter@test.local');
    const laptop = await signIn('resetter@test.local');
    const phone = await signIn('resetter@test.local');

    // The reset token is emailed, so the test reaches for the stored hash the
    // same way the controller does.
    const crypto = await import('crypto');
    const rawToken = 'a-known-reset-token';
    const User = (await import('../../src/models/User')).default;
    await User.updateOne(
      { email: 'resetter@test.local' },
      {
        resetPasswordToken: crypto
          .createHash('sha256')
          .update(rawToken)
          .digest('hex'),
        resetPasswordExpiry: new Date(Date.now() + 60_000),
      }
    );

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: NEW_PW })
      .expect(200);

    expect((await refreshWith(laptop)).status).toBe(401);
    expect((await refreshWith(phone)).status).toBe(401);
  });
});

describe('Access and refresh tokens are cryptographically separate', () => {
  it('refuses an access token presented as a refresh token', async () => {
    await registerCreator('crosstoken@test.local');
    const device = await signIn('crosstoken@test.local');
    const accessToken = cookieValue(device, 'access_token');

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${accessToken}`]);
    expect(res.status).toBe(401);
  });

  it('refuses a refresh token forged with the access secret', async () => {
    await registerCreator('forged@test.local');
    const forged = jwt.sign(
      {
        id: new mongoose.Types.ObjectId().toString(),
        email: 'forged@test.local',
        name: 'forged',
        role: 'author',
        type: 'refresh',
        sid: 'made-up',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${forged}`]);
    expect(res.status).toBe(401);
  });
});
