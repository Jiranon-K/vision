import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { cookiesOf, setupTestApp } from '../support/testApp';

const testApp = setupTestApp({ adminEmails: 'staff@test.local' });
const { api } = testApp;

let clearPostAuthorRole: typeof import('../../src/migrations/clearPostAuthorRole').clearPostAuthorRole;

beforeAll(async () => {
  ({ clearPostAuthorRole } = await import('../../src/migrations/clearPostAuthorRole'));
});

async function register(email: string) {
  const res = await testApp.register(email, 'Ada Writer');
  return { cookies: cookiesOf(res), user: res.body.user };
}

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

const setByline = (cookies: string[], byline: string) =>
  api()
    .put('/api/settings/profile')
    .set('Cookie', cookies)
    .send({ name: 'Ada Writer', byline });

const ROLE_WORDS = /\b(Admin|Author)\b/;

describe('A Post carries no role', () => {
  it('does not copy the Creator’s role onto a Post', async () => {
    const { cookies } = await register('creator@test.local');
    const res = await createPost(cookies);
    expect(res.status).toBe(201);
    expect(res.body.author.role).toBeUndefined();
  });

  it('does not copy an Admin’s role onto a Post either', async () => {
    const { cookies } = await register('staff@test.local');
    const res = await createPost(cookies);
    expect(res.body.author.role).toBeUndefined();
  });
});

describe('A Creator has a Byline', () => {
  it('returns the Byline wherever the profile is returned', async () => {
    const { cookies, user } = await register('byline@test.local');
    expect(user.profile.byline).toBe('');

    await setByline(cookies, 'Writes about search');

    const me = await api().get('/api/auth/me').set('Cookie', cookies);
    expect(me.body.profile.byline).toBe('Writes about search');
    const profile = await api().get('/api/settings/profile').set('Cookie', cookies);
    expect(profile.body.byline).toBe('Writes about search');
  });

  it('shows a Post’s writer by name alone until they write a Byline', async () => {
    const { cookies } = await register('nameonly@test.local');
    const created = await createPost(cookies);

    const res = await api().get(`/api/posts/slug/${created.body.slug}`);
    expect(res.body.author.name).toBe('Ada Writer');
    expect(res.body.author.byline ?? '').toBe('');
  });

  it('shows the writer’s Byline on the public blog once there is one', async () => {
    const { cookies } = await register('shown@test.local');
    const before = await createPost(cookies, { title: 'Written before' });
    await setByline(cookies, 'Writes about search');
    await createPost(cookies, { title: 'Written after' });

    const listing = await api().get('/api/posts/public');
    for (const post of listing.body.items) {
      expect(post.author.byline).toBe('Writes about search');
    }
    const read = await api().get(`/api/posts/slug/${before.body.slug}`);
    expect(read.body.author.byline).toBe('Writes about search');
  });
});

describe('The stale role is cleared from existing Posts', () => {
  async function insertLegacyPost(role: string, slug: string) {
    await mongoose.connection.db!.collection('posts').insertOne({
      title: 'Legacy',
      excerpt: 'e',
      content: 'c',
      category: 'SEO',
      status: 'Published',
      owner: new mongoose.Types.ObjectId(),
      author: { name: 'Old Writer', role },
      readTime: '1 min read',
      slug,
      previousSlugs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  it('leaves no role word beneath the writer’s name for a Reader', async () => {
    await insertLegacyPost('Admin', 'legacy-admin');
    await insertLegacyPost('Author', 'legacy-author');

    await clearPostAuthorRole();

    const listing = await api().get('/api/posts/public');
    expect(listing.body.items).toHaveLength(2);
    for (const post of listing.body.items) {
      expect(JSON.stringify(post.author)).not.toMatch(ROLE_WORDS);
    }
    const read = await api().get('/api/posts/slug/legacy-admin');
    expect(read.body.author).toEqual({ name: 'Old Writer' });
  });

  it('clears the value rather than converting it into a Byline', async () => {
    await insertLegacyPost('Admin', 'legacy');
    await clearPostAuthorRole();
    const stored = await mongoose.connection.db!.collection('posts').findOne({ slug: 'legacy' });
    expect(stored!.author).toEqual({ name: 'Old Writer' });
  });

  it('can be run again without harm', async () => {
    await insertLegacyPost('Admin', 'legacy');
    expect(await clearPostAuthorRole()).toBe(1);
    expect(await clearPostAuthorRole()).toBe(0);
  });
});
