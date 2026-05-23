import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.RESEND_API_KEY = 'test-key';
process.env.FRONTEND_URL = 'http://test.local';
process.env.EMAIL_FROM = 'noreply@test.local';

// Mock the email send module so we can capture the plain token
// passed to send functions. This avoids needing to render React
// templates back out to HTML to extract the URL.
const { sendResetMock, sendVerifyMock } = vi.hoisted(() => ({
  sendResetMock: vi.fn(),
  sendVerifyMock: vi.fn(),
}));
vi.mock('../../src/emails/send', () => ({
  sendResetPasswordEmail: sendResetMock,
  sendVerificationEmail: sendVerifyMock,
}));

let mongo: MongoMemoryServer;
let app: import('express').Express;

beforeAll(async () => {
  sendResetMock.mockResolvedValue(undefined);
  sendVerifyMock.mockResolvedValue(undefined);
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  const mod = await import('../../src/index');
  app = mod.app;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  sendResetMock.mockClear();
  sendResetMock.mockResolvedValue(undefined);
  sendVerifyMock.mockClear();
  sendVerifyMock.mockResolvedValue(undefined);
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
});

const validPassword = 'Aa1!aaaa';

async function registerUser(email = 'test@test.local') {
  return request(app)
    .post('/api/auth/register')
    .send({ email, password: validPassword, name: 'Test User' });
}

function tokenFromResetCall(): string {
  expect(sendResetMock).toHaveBeenCalledTimes(1);
  const args = sendResetMock.mock.calls[0];
  // sendResetPasswordEmail(to, plainToken, name)
  return args[1] as string;
}

function tokenFromVerifyCall(): string {
  expect(sendVerifyMock).toHaveBeenCalledTimes(1);
  const args = sendVerifyMock.mock.calls[0];
  // sendVerificationEmail(to, plainToken, name)
  return args[1] as string;
}

describe('Forgot → Reset flow', () => {
  it('completes successfully end-to-end', async () => {
    await registerUser('reset@test.local');
    sendResetMock.mockClear();

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@test.local' });
    expect(forgotRes.status).toBe(200);

    const token = tokenFromResetCall();
    expect(token).toBeTruthy();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'Bb2@bbbb' });
    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@test.local', password: 'Bb2@bbbb' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects expired reset token', async () => {
    await registerUser('expire@test.local');
    sendResetMock.mockClear();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'expire@test.local' });

    const token = tokenFromResetCall();

    const User = (await import('../../src/models/User')).default;
    await User.updateOne(
      { email: 'expire@test.local' },
      { resetPasswordExpiry: new Date(Date.now() - 1000) }
    );

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'Bb2@bbbb' });
    expect(resetRes.status).toBe(400);
  });

  it('returns 200 even for unknown email (no enumeration)', async () => {
    sendResetMock.mockClear();
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'never-registered@test.local' });
    expect(res.status).toBe(200);
    expect(sendResetMock).not.toHaveBeenCalled();
  });
});
