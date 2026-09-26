import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { cookiesOf, setupTestApp } from '../support/test-app';

const { api, register } = setupTestApp({ adminEmails: 'staff@test.local', syncIndexes: true });

let staff: string[];
let creator: string[];

beforeEach(async () => {
  staff = cookiesOf(await register('staff@test.local'));
  creator = cookiesOf(await register('creator@test.local'));
});

const REASON = 'Internal note: reported for copying a competitor article';

async function publish(cookies: string[], title = 'Contested Post') {
  const res = await api()
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({ title, content: 'uniqueword body text', category: 'SEO', status: 'Published' });
  expect(res.status).toBe(201);
  return res.body as { _id: string; slug: string };
}

const withhold = (cookies: string[], id: string, reason = REASON) =>
  api().post(`/api/posts/${id}/withhold`).set('Cookie', cookies).send({ reason });

const lift = (cookies: string[], id: string) =>
  api().delete(`/api/posts/${id}/withhold`).set('Cookie', cookies);

const publicTitles = async (query = '') =>
  (await api().get(`/api/posts/public${query}`)).body.items.map(
    (p: { title: string }) => p.title
  );

const stored = (id: string) =>
  mongoose.connection.db!.collection('posts').findOne({ _id: new mongoose.Types.ObjectId(id) });

describe('An Admin can withhold a Post and lift it again', () => {
  it('takes a Published Post away from Readers everywhere at once', async () => {
    const post = await publish(creator);

    const res = await withhold(staff, post._id);
    expect(res.status).toBe(200);

    expect(await publicTitles()).toEqual([]);
    expect(await publicTitles('?search=uniqueword')).toEqual([]);
    expect((await api().get(`/api/posts/slug/${post.slug}`)).status).toBe(404);
    expect((await api().get(`/api/posts/${post._id}`)).status).toBe(404);
  });

  it('records who withheld it, when, and why', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);

    const [record] = (await stored(post._id))!.withholdings;
    expect(String(record.by)).toBeTruthy();
    expect(record.at).toBeInstanceOf(Date);
    expect(record.reason).toBe(REASON);
  });

  it('makes the Post visible again when lifted, and keeps the record', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);

    const res = await lift(staff, post._id);
    expect(res.status).toBe(200);

    expect(await publicTitles()).toEqual(['Contested Post']);
    expect((await api().get(`/api/posts/slug/${post.slug}`)).status).toBe(200);
    const [record] = (await stored(post._id))!.withholdings;
    expect(record.by).toBeTruthy();
    expect(record.at).toBeInstanceOf(Date);
    expect(record.liftedAt).toBeInstanceOf(Date);
    expect(record.liftedBy).toBeTruthy();
  });

  it('requires a reason', async () => {
    const post = await publish(creator);
    expect((await withhold(staff, post._id, '')).status).toBe(400);
  });

  it('only withholds a Post that is Published', async () => {
    const draft = await api()
      .post('/api/posts')
      .set('Cookie', creator)
      .send({ title: 'Draft', content: 'body', category: 'SEO', status: 'Draft' });
    expect((await withhold(staff, draft.body._id)).status).toBe(403);
  });
});

describe('A Creator cannot withhold or lift anything', () => {
  it('refuses to let a Creator withhold their own Post', async () => {
    const post = await publish(creator);
    expect((await withhold(creator, post._id)).status).toBe(403);
    expect(await publicTitles()).toEqual(['Contested Post']);
  });

  it('refuses to let a Creator lift a withholding on their own Post', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);
    expect((await lift(creator, post._id)).status).toBe(403);
    expect(await publicTitles()).toEqual([]);
  });

  it('keeps a Withheld Post hidden when its Creator edits and re-publishes it', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);

    const toDraft = await api()
      .put(`/api/posts/${post._id}`)
      .set('Cookie', creator)
      .send({ status: 'Draft' });
    expect(toDraft.status).toBe(200);
    const back = await api()
      .put(`/api/posts/${post._id}`)
      .set('Cookie', creator)
      .send({ title: 'Edited', status: 'Published' });
    expect(back.status).toBe(200);

    expect(await publicTitles()).toEqual([]);
    expect((await api().get(`/api/posts/slug/${post.slug}`)).status).toBe(404);
  });
});

describe('The Creator is told their Post is Withheld, and not why', () => {
  it('shows the Withheld state in the Hub, with no reason anywhere', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);

    const hub = await api().get('/api/posts').set('Cookie', creator);
    expect(hub.body.items[0].withheld).toBe(true);
    expect(hub.body.items[0].permissions).toContain('edit');
    expect(hub.body.items[0].permissions).not.toContain('restore');

    const byId = await api().get(`/api/posts/${post._id}`).set('Cookie', creator);
    expect(byId.body.withheld).toBe(true);

    const saved = await api()
      .put(`/api/posts/${post._id}`)
      .set('Cookie', creator)
      .send({ title: 'Still mine' });

    for (const res of [hub, byId, saved]) {
      expect(res.text).not.toContain(REASON);
      expect(res.text).not.toContain('withholdings');
    }
  });

  it('advertises withhold and restore to an Admin, and to no one else', async () => {
    const post = await publish(creator);
    const before = await api().get(`/api/posts/${post._id}`).set('Cookie', staff);
    expect(before.body.permissions).toEqual(['withhold']);

    await withhold(staff, post._id);
    const after = await api().get(`/api/posts/${post._id}`).set('Cookie', staff);
    expect(after.body.permissions).toEqual(['restore']);
  });
});

describe('A Withheld Post is treated as a Draft is by Views', () => {
  it('accumulates no Views', async () => {
    const post = await publish(creator);
    await withhold(staff, post._id);

    const res = await api().post(`/api/posts/${post._id}/view`);
    expect(res.status).toBe(204);
    expect((await stored(post._id))!.views).toBe(0);
  });
});
