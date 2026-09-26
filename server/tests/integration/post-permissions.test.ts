import { describe, it, expect } from 'vitest';
import { cookiesOf, setupTestApp } from '../support/test-app';

const testApp = setupTestApp({ adminEmails: 'staff@test.local' });
const { api } = testApp;

const register = async (email: string) => cookiesOf(await testApp.register(email));

const createPost = (cookies: string[], body: Record<string, unknown> = {}) =>
  api()
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      title: 'A Post',
      content: 'hello world content here',
      category: 'SEO',
      status: 'Published',
      ...body,
    });

describe('A signed-in response says what the caller may do', () => {
  it('lists the owner’s actions on every Post in the Hub listing', async () => {
    const creator = await register('creator@test.local');
    await createPost(creator, { status: 'Draft', title: 'One' });
    await createPost(creator, { title: 'Two' });

    const res = await api().get('/api/posts').set('Cookie', creator);
    expect(res.body.items).toHaveLength(2);
    for (const post of res.body.items) {
      expect([...post.permissions].sort()).toEqual(['delete', 'edit', 'publish']);
    }
  });

  it('gives an Admin only withholding on another Creator’s Post in the Hub listing', async () => {
    const admin = await register('staff@test.local');
    const creator = await register('creator@test.local');
    await createPost(creator, { title: 'Theirs' });
    await createPost(admin, { title: 'Mine' });

    const res = await api().get('/api/posts').set('Cookie', admin);
    const byTitle = Object.fromEntries(
      res.body.items.map((p: { title: string; permissions: string[] }) => [p.title, p.permissions])
    );
    expect(byTitle.Theirs).toEqual(['withhold']);
    expect([...byTitle.Mine].sort()).toEqual(['delete', 'edit', 'publish', 'withhold']);
  });

  it('lists the caller’s actions when a single Post is fetched by id', async () => {
    const owner = await register('owner@test.local');
    const other = await register('other@test.local');
    const post = await createPost(owner);

    const mine = await api().get(`/api/posts/${post.body._id}`).set('Cookie', owner);
    expect([...mine.body.permissions].sort()).toEqual(['delete', 'edit', 'publish']);

    const theirs = await api().get(`/api/posts/${post.body._id}`).set('Cookie', other);
    expect(theirs.status).toBe(200);
    expect(theirs.body.permissions).toEqual([]);
  });

  it('lists the caller’s actions on the Post it just created or saved', async () => {
    const owner = await register('owner@test.local');
    const created = await createPost(owner);
    expect(created.body.permissions).toContain('edit');

    const saved = await api()
      .put(`/api/posts/${created.body._id}`)
      .set('Cookie', owner)
      .send({ title: 'Renamed' });
    expect(saved.body.permissions).toContain('edit');
  });
});

describe('A Reader is told nothing about permissions', () => {
  it('carries no permissions field on any Post in the public listing', async () => {
    const creator = await register('creator@test.local');
    await createPost(creator);
    await createPost(creator, { title: 'Another' });

    const res = await api().get('/api/posts/public').set('Cookie', creator);
    expect(res.body.items).toHaveLength(2);
    for (const post of res.body.items) {
      expect('permissions' in post).toBe(false);
    }
  });

  it('carries no permissions field on a Post read anonymously, by id or Slug', async () => {
    const creator = await register('creator@test.local');
    const post = await createPost(creator);

    const byId = await api().get(`/api/posts/${post.body._id}`);
    expect(byId.status).toBe(200);
    expect('permissions' in byId.body).toBe(false);

    const bySlug = await api().get(`/api/posts/slug/${post.body.slug}`);
    expect('permissions' in bySlug.body).toBe(false);
  });
});
