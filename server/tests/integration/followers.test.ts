import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestApp, cookiesOf } from '../support/test-app';

// Outgoing email is captured, never sent: the tests assert on what a Reader or
// Follower would receive.
const { sendConfirm, sendDelivery } = vi.hoisted(() => ({
  sendConfirm: vi.fn(),
  sendDelivery: vi.fn(),
}));
vi.mock('../../src/platform/emails/send', () => ({
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendFollowConfirmationEmail: sendConfirm,
  sendDeliveryEmail: sendDelivery,
}));

process.env.FRONTEND_URL = 'http://test.local';

const { api, register } = setupTestApp({ adminEmails: 'staff@test.local' });

beforeEach(() => {
  sendConfirm.mockReset().mockResolvedValue(undefined);
  sendDelivery.mockReset().mockResolvedValue(undefined);
});

async function creator(email = 'mara@test.local', name = 'Mara Lindqvist') {
  return cookiesOf(await register(email, name));
}

async function publish(
  cookies: string[],
  body: Record<string, unknown> = {}
): Promise<{ id: string; slug: string }> {
  const res = await api()
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: `Post ${Math.random()}`,
      content: 'Something worth reading, at some length.',
      category: 'SEO',
      status: 'Published',
      ...body,
    });
  expect(res.status).toBe(201);
  return { id: res.body._id, slug: res.body.slug };
}

const follow = (postId: string, email: string) =>
  api().post('/api/followers').send({ postId, email });

/** The confirmation token from the last confirmation email sent to `email`. */
function lastConfirmToken(email: string): string {
  const address = email.trim().toLowerCase();
  const call = [...sendConfirm.mock.calls].reverse().find((c) => c[0].to === address);
  expect(call, `no confirmation email to ${email}`).toBeDefined();
  return new URL(call![0].confirmUrl).searchParams.get('token')!;
}

async function followAndConfirm(postId: string, email: string) {
  expect((await follow(postId, email)).status).toBe(202);
  const res = await api()
    .post('/api/followers/confirm')
    .send({ token: lastConfirmToken(email) });
  expect(res.status).toBe(200);
  return res;
}

const listFollowers = (cookies: string[]) =>
  api().get('/api/followers').set('Cookie', cookies);

describe('A Reader follows a Creator and confirms', () => {
  it('sends a confirmation from the Creator via Vision, and counts nobody until it is confirmed', async () => {
    const mara = await creator();
    const post = await publish(mara);

    const res = await follow(post.id, 'reader@example.com');
    expect(res.status).toBe(202);

    expect(sendConfirm).toHaveBeenCalledTimes(1);
    const email = sendConfirm.mock.calls[0][0];
    expect(email.to).toBe('reader@example.com');
    expect(email.creatorName).toBe('Mara Lindqvist');
    expect(email.confirmUrl).toMatch(/^http:\/\/test\.local\/follow\/confirm\?token=/);

    expect((await listFollowers(mara)).body.items).toEqual([]);
  });

  it('makes the Reader a Follower once they confirm, and says whom they follow and where they came from', async () => {
    const mara = await creator();
    const post = await publish(mara);

    const res = await followAndConfirm(post.id, 'Reader@Example.com ');
    expect(res.body.creator.name).toBe('Mara Lindqvist');
    expect(res.body.post.slug).toBe(post.slug);

    const list = await listFollowers(mara);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].email).toBe('reader@example.com');
    expect(list.body.items[0].since).toBeDefined();
  });

  it('answers the same way for a new, a pending and a confirmed address, and never makes a second Follower', async () => {
    const mara = await creator();
    const post = await publish(mara);

    const first = await follow(post.id, 'reader@example.com');
    const pending = await follow(post.id, 'reader@example.com');
    await api().post('/api/followers/confirm').send({ token: lastConfirmToken('reader@example.com') });
    const confirmed = await follow(post.id, 'reader@example.com');

    expect(pending.status).toBe(first.status);
    expect(confirmed.status).toBe(first.status);
    expect(pending.body).toEqual(first.body);
    expect(confirmed.body).toEqual(first.body);

    // A confirmed address is not sent another confirmation.
    expect(sendConfirm).toHaveBeenCalledTimes(2);
    expect((await listFollowers(mara)).body.items).toHaveLength(1);
  });

  it('refuses a confirmation link that was already used', async () => {
    const mara = await creator();
    const post = await publish(mara);
    await follow(post.id, 'reader@example.com');
    const token = lastConfirmToken('reader@example.com');

    expect((await api().post('/api/followers/confirm').send({ token })).status).toBe(200);
    const again = await api().post('/api/followers/confirm').send({ token });
    expect(again.status).toBe(410);
  });

  it('refuses a confirmation link older than 48 hours', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const mara = await creator();
      const post = await publish(mara);
      await follow(post.id, 'reader@example.com');
      const token = lastConfirmToken('reader@example.com');

      vi.setSystemTime(new Date(Date.now() + 49 * 60 * 60 * 1000));
      const res = await api().post('/api/followers/confirm').send({ token });
      expect(res.status).toBe(410);

      // Back to the present, where the Creator's session is still valid.
      vi.useRealTimers();
      expect((await listFollowers(mara)).body.items).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects an address that is not an email, and a Post a Reader cannot read', async () => {
    const mara = await creator();
    const post = await publish(mara);
    const draft = await publish(mara, { status: 'Draft' });

    expect((await follow(post.id, 'not-an-email')).status).toBe(400);
    expect((await follow(draft.id, 'reader@example.com')).status).toBe(404);
    expect(sendConfirm).not.toHaveBeenCalled();
  });

  it('keeps following two Creators as two separate Followers', async () => {
    const mara = await creator();
    const ben = await creator('ben@test.local', 'Ben Newcomer');
    const maraPost = await publish(mara);
    const benPost = await publish(ben);

    await followAndConfirm(maraPost.id, 'reader@example.com');
    expect((await listFollowers(ben)).body.items).toEqual([]);

    await followAndConfirm(benPost.id, 'reader@example.com');
    expect((await listFollowers(mara)).body.items).toHaveLength(1);
    expect((await listFollowers(ben)).body.items).toHaveLength(1);
  });

  it('still accepts the follow when the confirmation email cannot be sent', async () => {
    sendConfirm.mockRejectedValue(new Error('provider down'));
    const mara = await creator();
    const post = await publish(mara);
    expect((await follow(post.id, 'reader@example.com')).status).toBe(202);
  });
});

// --- Deliveries ------------------------------------------------------------

const drain = async (now = new Date(), limit?: number) =>
  (await import('../../src/modules/followers')).drainDeliveries(now, limit ? { limit } : {});

async function creatorWithFollowers(count: number, email = 'mara@test.local') {
  const cookies = await creator(email);
  const origin = await publish(cookies);
  for (let i = 0; i < count; i++) {
    await followAndConfirm(origin.id, `reader${i}@example.com`);
  }
  return cookies;
}

const idOf = async (cookies: string[]): Promise<string> =>
  (await api().get('/api/auth/me').set('Cookie', cookies)).body.id;

describe('A Creator delivers a Post to their Followers when publishing', () => {
  it('reaches every Follower, from the Creator via Vision, with replies going to the Creator', async () => {
    const mara = await creatorWithFollowers(2);
    const res = await api()
      .post('/api/posts')
      .set('Cookie', mara)
      .send({ title: 'The new one', content: 'Worth it.', category: 'SEO', status: 'Published', deliver: true });
    expect(res.status).toBe(201);
    expect(res.body.delivery.followers).toBe(2);

    await drain();
    expect(sendDelivery).toHaveBeenCalledTimes(2);
    const email = sendDelivery.mock.calls[0][0];
    expect(email.creatorName).toBe('Mara Lindqvist');
    expect(email.replyTo).toBe('mara@test.local');
    expect(email.title).toBe('The new one');
    expect(email.readUrl).toBe(`http://test.local/blog/${res.body.slug}?from=delivery`);
    expect(email.stopUrl).toMatch(/^http:\/\/test\.local\/follow\/stop\?token=[0-9a-f]{64}$/);
    expect(new Set(sendDelivery.mock.calls.map((c) => c[0].to))).toEqual(
      new Set(['reader0@example.com', 'reader1@example.com'])
    );
  });

  it('sends nothing when the Creator publishes without choosing to deliver', async () => {
    const mara = await creatorWithFollowers(1);
    await publish(mara);
    await drain();
    expect(sendDelivery).not.toHaveBeenCalled();
  });

  it('delivers a Post at most once, whatever happens to it afterwards', async () => {
    const mara = await creatorWithFollowers(1);
    const post = await publish(mara, { deliver: true });
    await drain();

    await api().put(`/api/posts/${post.id}`).set('Cookie', mara).send({ title: 'Typo fixed', deliver: true });
    await api().put(`/api/posts/${post.id}`).set('Cookie', mara).send({ status: 'Draft' });
    const again = await api()
      .put(`/api/posts/${post.id}`)
      .set('Cookie', mara)
      .send({ status: 'Published', deliver: true });
    expect(again.body.delivery.followers).toBe(1);

    await drain();
    expect(sendDelivery).toHaveBeenCalledTimes(1);
  });

  it('delivers when a Draft is published with delivery chosen', async () => {
    const mara = await creatorWithFollowers(1);
    const draft = await publish(mara, { status: 'Draft' });
    await api().put(`/api/posts/${draft.id}`).set('Cookie', mara).send({ status: 'Published', deliver: true });
    await drain();
    expect(sendDelivery).toHaveBeenCalledTimes(1);
  });

  it('never delivers a Withheld Post', async () => {
    const mara = await creatorWithFollowers(1);
    const staff = cookiesOf(await register('staff@test.local', 'Staff'));
    const post = await publish(mara, { status: 'Draft' });
    // Published quietly, withheld, then returned to Draft and published again.
    await api().put(`/api/posts/${post.id}`).set('Cookie', mara).send({ status: 'Published' });
    const withheld = await api().post(`/api/posts/${post.id}/withhold`).set('Cookie', staff).send({ reason: 'Spam' });
    expect(withheld.status).toBe(200);
    await api().put(`/api/posts/${post.id}`).set('Cookie', mara).send({ status: 'Draft' });
    await api().put(`/api/posts/${post.id}`).set('Cookie', mara).send({ status: 'Published', deliver: true });
    await drain();
    expect(sendDelivery).not.toHaveBeenCalled();
  });

  it('publishes even when email cannot be sent, and tries again later', async () => {
    sendDelivery.mockRejectedValue(new Error('provider down'));
    const mara = await creatorWithFollowers(1);
    const post = await publish(mara, { deliver: true });

    const now = new Date();
    expect((await drain(now)).failed).toBe(1);

    sendDelivery.mockReset().mockResolvedValue(undefined);
    await drain(now);
    expect(sendDelivery).not.toHaveBeenCalled(); // the retry is not due yet

    await drain(new Date(now.getTime() + 6 * 60 * 1000));
    expect(sendDelivery).toHaveBeenCalledTimes(1);
    expect((await api().get(`/api/posts/${post.id}`)).status).toBe(200);
  });

  it('gives up on an email after five failed attempts', async () => {
    sendDelivery.mockRejectedValue(new Error('provider down'));
    const mara = await creatorWithFollowers(1);
    await publish(mara, { deliver: true });

    let at = Date.now();
    for (let i = 0; i < 8; i++) {
      await drain(new Date(at));
      at += 2 * 60 * 60 * 1000;
    }
    expect(sendDelivery).toHaveBeenCalledTimes(5);
  });

  it('tells the Creator how many Followers a Delivery will reach, and how many can be sent today', async () => {
    const mara = await creatorWithFollowers(3);
    const res = await api().get('/api/followers/summary').set('Cookie', mara);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ followers: 3, weeklyGain: 3 });
    expect(res.body.sendableToday).toBeGreaterThan(0);
  });
});

describe('Deliveries respect the daily sending limit', () => {
  it('sends up to the limit today and the rest the next UTC day', async () => {
    const mara = await creatorWithFollowers(5);
    await publish(mara, { deliver: true });

    expect(await drain(new Date('2026-10-01T10:00:00Z'), 3)).toMatchObject({ sent: 3, limited: true });
    expect((await drain(new Date('2026-10-01T23:00:00Z'), 3)).sent).toBe(0);
    expect((await drain(new Date('2026-10-02T00:30:00Z'), 3)).sent).toBe(2);
    expect(sendDelivery).toHaveBeenCalledTimes(5);
  });

  it('never sends one email twice when drains run at once', async () => {
    const mara = await creatorWithFollowers(6);
    await publish(mara, { deliver: true });

    const now = new Date();
    await Promise.all([drain(now), drain(now), drain(now)]);
    expect(sendDelivery).toHaveBeenCalledTimes(6);
    expect(new Set(sendDelivery.mock.calls.map((c) => c[0].to)).size).toBe(6);
  });

  it('holds the limit across concurrent drains', async () => {
    const mara = await creatorWithFollowers(6);
    await publish(mara, { deliver: true });

    const now = new Date('2026-10-05T08:00:00Z');
    await Promise.all([drain(now, 4), drain(now, 4)]);
    expect(sendDelivery).toHaveBeenCalledTimes(4);
  });
});

// --- Stopping --------------------------------------------------------------

describe('A Follower stops following from any Delivery', () => {
  async function deliveredTo(address: string) {
    const mara = await creator();
    const origin = await publish(mara);
    await followAndConfirm(origin.id, address);
    await publish(mara, { deliver: true });
    await drain();
    const call = sendDelivery.mock.calls.find((c) => c[0].to === address)!;
    return { mara, email: call[0] };
  }

  it('stops from the link without signing in, and says whom they stopped following', async () => {
    const { mara, email } = await deliveredTo('reader@example.com');
    const token = new URL(email.stopUrl).searchParams.get('token');

    const res = await api().post('/api/followers/stop').send({ token });
    expect(res.status).toBe(200);
    expect(res.body.creator.name).toBe('Mara Lindqvist');
    expect((await listFollowers(mara)).body.items).toEqual([]);

    // A second click is not an error.
    expect((await api().post('/api/followers/stop').send({ token })).status).toBe(200);
  });

  it("works from a mail client's one-click unsubscribe", async () => {
    const { mara, email } = await deliveredTo('reader@example.com');
    const path = new URL(email.oneClickStopUrl).pathname;
    const res = await api().post(path).type('form').send('List-Unsubscribe=One-Click');
    expect(res.status).toBe(200);
    expect((await listFollowers(mara)).body.items).toEqual([]);
  });

  it('cancels a Delivery still waiting to be sent to them', async () => {
    const mara = await creator();
    const origin = await publish(mara);
    await followAndConfirm(origin.id, 'reader@example.com');
    await followAndConfirm(origin.id, 'other@example.com');
    await publish(mara, { deliver: true });

    // Their stop link comes from an earlier Delivery; this one is still queued.
    const Follower = (await import('../../src/modules/followers/follower.model')).default;
    const { stopToken } = (await Follower.findOne({ email: 'reader@example.com' }))!;
    await api().post('/api/followers/stop').send({ token: stopToken });

    await drain();
    expect(sendDelivery.mock.calls.map((c) => c[0].to)).toEqual(['other@example.com']);
  });
});

// --- Owning the list -------------------------------------------------------

describe('A Creator sees and exports their Followers', () => {
  it('exports confirmed Followers as CSV, newest first', async () => {
    const mara = await creator();
    const post = await publish(mara);
    await followAndConfirm(post.id, 'first@example.com');
    await followAndConfirm(post.id, 'second@example.com');
    await follow(post.id, 'unconfirmed@example.com');

    const res = await api().get('/api/followers/export').set('Cookie', mara);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/followers\.csv/);
    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('email,following_since');
    expect(lines.slice(1).map((l) => l.split(',')[0])).toEqual(['second@example.com', 'first@example.com']);
  });

  it("never shows a Creator another Creator's Followers", async () => {
    const mara = await creator();
    const ben = await creator('ben@test.local', 'Ben Newcomer');
    const post = await publish(mara);
    await followAndConfirm(post.id, 'reader@example.com');

    expect((await listFollowers(ben)).body.items).toEqual([]);
    const count = await api().get(`/api/followers/count/${await idOf(mara)}`).set('Cookie', ben);
    expect(count.status).toBe(404);
  });

  it('gives an Admin the count and never the addresses', async () => {
    const mara = await creator();
    const post = await publish(mara);
    await followAndConfirm(post.id, 'reader@example.com');
    const staff = cookiesOf(await register('staff@test.local', 'Staff'));

    const count = await api().get(`/api/followers/count/${await idOf(mara)}`).set('Cookie', staff);
    expect(count.status).toBe(200);
    expect(count.body).toEqual({ count: 1 });

    const list = await listFollowers(staff);
    expect(JSON.stringify(list.body)).not.toContain('reader@example.com');
  });

  it('requires a session to list or export', async () => {
    expect((await api().get('/api/followers')).status).toBe(401);
    expect((await api().get('/api/followers/export')).status).toBe(401);
  });
});

// --- Growth Analytics ------------------------------------------------------

describe('Growth Analytics reports Followers and Views from Deliveries', () => {
  const AGENT = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36';

  it('counts a read that came from a Delivery as a View, and reports it apart', async () => {
    const mara = await creatorWithFollowers(2);
    const post = await publish(mara, { deliver: true });
    await drain();

    await api().post(`/api/posts/${post.id}/view`).set('User-Agent', AGENT).send({ source: 'delivery' });
    await api().post(`/api/posts/${post.id}/view`).set('User-Agent', `${AGENT} Other`).send({});

    expect((await api().get(`/api/posts/${post.id}`)).body.views).toBe(2);

    const res = await api().get('/api/analytics/followers').set('Cookie', mara);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      followers: 2,
      weeklyGain: 2,
      delivered: 2,
      deliveries: 1,
      viewsFromDeliveries: 1,
    });
  });

  it('applies the usual deduplication to Views from Deliveries', async () => {
    const mara = await creatorWithFollowers(1);
    const post = await publish(mara, { deliver: true });
    for (let i = 0; i < 3; i++) {
      await api().post(`/api/posts/${post.id}/view`).set('User-Agent', AGENT).send({ source: 'delivery' });
    }
    const res = await api().get('/api/analytics/followers').set('Cookie', mara);
    expect(res.body.viewsFromDeliveries).toBe(1);
  });
});
