import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env['NODE_ENV'] = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-secret-refresh';
process.env.ADMIN_EMAILS = 'admin@test.local';

let mongo: MongoMemoryServer;
let app: import('express').Express;
let Post: typeof import('../../src/models/Post').default;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  app = (await import('../../src/index')).app;
  Post = (await import('../../src/models/Post')).default;
  await Post.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
  await Post.syncIndexes();
});

const PW = 'Aa1!aaaa';

async function register(email: string): Promise<string[]> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PW, name: email });
  expect(res.status).toBe(201);
  return res.headers['set-cookie'] as unknown as string[];
}

async function createPost(
  cookies: string[],
  body: Record<string, unknown>
): Promise<void> {
  const res = await request(app)
    .post('/api/posts')
    .set('Cookie', cookies)
    .send({
      content: 'hello world content here',
      category: 'SEO',
      status: 'Published',
      ...body,
    });
  expect(res.status).toBe(201);
}

async function seed(): Promise<string[]> {
  const cookies = await register('search@test.local');
  await createPost(cookies, { title: 'Learning C++ Basics' });
  await createPost(cookies, { title: 'Regex .* Cheatsheet' });
  await createPost(cookies, { title: 'Marketing Fundamentals' });
  return cookies;
}

// The Hub list is the Creator's own, so a search narrows inside that constraint
// rather than across the platform.
function search(term: string, cookies: string[]) {
  return request(app)
    .get('/api/posts')
    .set('Cookie', cookies)
    .query({ search: term });
}

const titles = (body: { title: string }[]) => body.map((p) => p.title);

describe('Post search treats the term as literal text', () => {
  it('matches a term containing regex metacharacters instead of erroring', async () => {
    const cookies = await seed();

    const res = await search('c++', cookies);

    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(['Learning C++ Basics']);
  });

  it('does not let a wildcard term match every post', async () => {
    const cookies = await seed();

    const res = await search('.*', cookies);

    // A term of pure punctuation carries no word to match, so it matches
    // nothing. What must never happen is the opposite: `.*` evaluated as a
    // pattern would have returned every Post the Creator owns.
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('keeps case-insensitive matching', async () => {
    const cookies = await seed();

    const res = await search('basics', cookies);

    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(['Learning C++ Basics']);
  });
});

describe('Search covers the fields a Creator would expect', () => {
  it('matches a word that appears only in the body', async () => {
    const cookies = await register('body@test.local');
    await createPost(cookies, {
      title: 'An Unremarkable Headline',
      content: 'The body mentions hydroponics and nothing else of note.',
    });
    await createPost(cookies, { title: 'Another Post' });

    const res = await search('hydroponics', cookies);
    expect(titles(res.body)).toEqual(['An Unremarkable Headline']);
  });

  it('matches a word that appears only in the Excerpt', async () => {
    const cookies = await register('excerpt@test.local');
    await createPost(cookies, {
      title: 'Plain Title',
      excerpt: 'A summary about permaculture.',
    });
    await createPost(cookies, { title: 'Another Post' });

    const res = await search('permaculture', cookies);
    expect(titles(res.body)).toEqual(['Plain Title']);
  });

  it('ranks a title match above a body-only match', async () => {
    const cookies = await register('rank@test.local');
    await createPost(cookies, {
      title: 'An Ordinary Operations Post',
      content: 'kubernetes appears here in the body only.',
    });
    await createPost(cookies, { title: 'Kubernetes For Creators' });

    const res = await search('kubernetes', cookies);
    expect(titles(res.body)[0]).toBe('Kubernetes For Creators');
  });

  it('matches whole words rather than substrings', async () => {
    const cookies = await register('substring@test.local');
    await createPost(cookies, { title: 'Carpentry Notes' });

    const res = await search('carpet', cookies);
    expect(res.body).toHaveLength(0);
  });
});

describe('Search obeys the rules the list obeys', () => {
  it('returns only the searching Creator’s Posts', async () => {
    const a = await register('search-a@test.local');
    await createPost(a, { title: 'Shared Subject Matter' });

    const b = await register('search-b@test.local');
    await createPost(b, { title: 'Shared Subject Matter' });

    const res = await search('shared subject', a);
    expect(res.body).toHaveLength(1);
  });

  it('includes the Creator’s own Drafts', async () => {
    const a = await register('search-draft@test.local');
    await createPost(a, { title: 'Unfinished Thoughts', status: 'Draft' });

    const res = await search('unfinished', a);
    expect(titles(res.body)).toEqual(['Unfinished Thoughts']);
  });

  it('returns Published Posts only on the Reader’s list', async () => {
    const a = await register('search-public@test.local');
    await createPost(a, { title: 'Hidden Manuscript', status: 'Draft' });
    await createPost(a, { title: 'Public Manuscript' });

    const res = await request(app)
      .get('/api/posts/public')
      .query({ search: 'manuscript' });
    expect(titles(res.body)).toEqual(['Public Manuscript']);
  });

  it('combines with a Category filter', async () => {
    const a = await register('search-cat@test.local');
    await createPost(a, { title: 'Growth Tactics', category: 'SEO' });
    await createPost(a, { title: 'Growth Stories', category: 'Content' });

    const res = await request(app)
      .get('/api/posts')
      .set('Cookie', a)
      .query({ search: 'growth', category: 'SEO' });
    expect(titles(res.body)).toEqual(['Growth Tactics']);
  });
});

describe('Search edge cases', () => {
  it('returns an empty result rather than an error when nothing matches', async () => {
    const cookies = await seed();

    const res = await search('nothingmatchesthis', cookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('treats a term below the minimum length as no search', async () => {
    const cookies = await seed();

    const res = await search('a', cookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('searches non-Latin content', async () => {
    const cookies = await register('search-thai@test.local');
    await createPost(cookies, {
      title: 'การเขียนบทความ',
      content: 'เนื้อหาเกี่ยวกับการเขียน',
    });
    await createPost(cookies, { title: 'Unrelated English Post' });

    const res = await search('การเขียนบทความ', cookies);
    expect(titles(res.body)).toEqual(['การเขียนบทความ']);
  });
});
