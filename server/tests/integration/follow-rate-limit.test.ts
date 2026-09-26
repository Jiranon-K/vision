import { describe, it, expect, vi, afterEach } from 'vitest';
import { setupTestApp, cookiesOf } from '../support/test-app';

vi.mock('../../src/platform/emails/send', () => ({
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendFollowConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendDeliveryEmail: vi.fn().mockResolvedValue(undefined),
}));

// Rate limiters are skipped under NODE_ENV=test (platform/rate-limit.ts). This
// file switches them on for the requests it makes, so the follow form's
// budgets are exercised for real. It lives apart because the in-memory
// counters it fills would leak into any test that ran after it.
const { api, register } = setupTestApp();

afterEach(() => {
  process.env['NODE_ENV'] = 'test';
});

async function readablePost(): Promise<string> {
  const cookies = cookiesOf(await register('limits@test.local', 'Limits'));
  const res = await api()
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({ title: 'Limits', content: 'Body', category: 'SEO', status: 'Published' });
  return res.body._id;
}

describe('the follow form is rate limited', () => {
  it('refuses a fourth request for the same address within the hour', async () => {
    const postId = await readablePost();
    process.env['NODE_ENV'] = 'development';

    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await api().post('/api/followers').send({ postId, email: 'flooded@example.com' })).status);
    }
    expect(statuses).toEqual([202, 202, 202, 429]);

    // Another address is a separate budget.
    const other = await api().post('/api/followers').send({ postId, email: 'someone.else@example.com' });
    expect(other.status).toBe(202);
  });
});
