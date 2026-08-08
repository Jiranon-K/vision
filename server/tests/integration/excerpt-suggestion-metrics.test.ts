import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env['NODE_ENV'] = 'test';

let mongo: MongoMemoryServer;
let Post: typeof import('../../src/models/Post').default;
let ExcerptSuggestion: typeof import('../../src/models/ExcerptSuggestion').default;
let computeAdoption: typeof import('../../src/reporting/excerptSuggestionMetrics').computeAdoption;
let computeKeptUnedited: typeof import('../../src/reporting/excerptSuggestionMetrics').computeKeptUnedited;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  Post = (await import('../../src/models/Post')).default;
  ExcerptSuggestion = (await import('../../src/models/ExcerptSuggestion')).default;
  ({ computeAdoption, computeKeptUnedited } = await import(
    '../../src/reporting/excerptSuggestionMetrics'
  ));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) await c.deleteMany({});
});

const OWNER = new mongoose.Types.ObjectId();

async function makePost(overrides: Partial<{
  status: 'Published' | 'Draft';
  excerpt: string;
  createdAt: Date;
}> = {}) {
  const post = new Post({
    title: 'A post',
    excerpt: overrides.excerpt ?? 'An excerpt',
    content: 'Some content',
    category: 'SEO',
    status: overrides.status ?? 'Published',
    readTime: '1 min read',
    slug: `post-${new mongoose.Types.ObjectId().toString()}`,
    owner: OWNER,
    author: { name: 'Author', role: 'Author' },
  });
  await post.save();
  if (overrides.createdAt) {
    // timestamps: true marks createdAt immutable to Model.updateOne; go through
    // the native collection to backdate it for this test.
    await Post.collection.updateOne(
      { _id: post._id },
      { $set: { createdAt: overrides.createdAt } }
    );
  }
  return post;
}

async function makeSuggestion(overrides: {
  post?: mongoose.Types.ObjectId;
  text?: string;
  source?: 'provider' | 'fallback';
  createdAt?: Date;
} = {}) {
  const suggestion = new ExcerptSuggestion({
    creator: OWNER,
    post: overrides.post,
    text: overrides.text ?? 'Suggested text',
    source: overrides.source ?? 'provider',
  });
  await suggestion.save();
  if (overrides.createdAt) {
    await ExcerptSuggestion.collection.updateOne(
      { _id: suggestion._id },
      { $set: { createdAt: overrides.createdAt } }
    );
  }
  return suggestion;
}

describe('computeAdoption', () => {
  it('returns null when no Posts were published in the window', async () => {
    const result = await computeAdoption(30);
    expect(result.publishedPosts).toBe(0);
    expect(result.adoptionRate).toBeNull();
  });

  it('counts a published Post with a suggestion as adopted', async () => {
    const post = await makePost({ status: 'Published' });
    await makeSuggestion({ post: post._id });

    const result = await computeAdoption(30);
    expect(result.publishedPosts).toBe(1);
    expect(result.postsWithSuggestion).toBe(1);
    expect(result.adoptionRate).toBe(1);
  });

  it('does not count a published Post with no suggestion', async () => {
    await makePost({ status: 'Published' });

    const result = await computeAdoption(30);
    expect(result.publishedPosts).toBe(1);
    expect(result.postsWithSuggestion).toBe(0);
    expect(result.adoptionRate).toBe(0);
  });

  it('ignores Drafts and Posts published outside the window', async () => {
    await makePost({ status: 'Draft' });
    const old = await makePost({
      status: 'Published',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    });
    await makeSuggestion({ post: old._id });

    const result = await computeAdoption(30);
    expect(result.publishedPosts).toBe(0);
    expect(result.adoptionRate).toBeNull();
  });
});

describe('computeKeptUnedited', () => {
  it('returns null when no suggestion reached a saved Post in the window', async () => {
    // A suggestion with no post (asked before ever saving) does not count.
    await makeSuggestion({ post: undefined });

    const result = await computeKeptUnedited(30);
    expect(result.issuedSuggestions).toBe(0);
    expect(result.keptUneditedRate).toBeNull();
  });

  it('counts a suggestion whose text matches the Post excerpt exactly as kept unedited', async () => {
    const post = await makePost({ excerpt: 'Exact match' });
    await makeSuggestion({ post: post._id, text: 'Exact match' });

    const result = await computeKeptUnedited(30);
    expect(result.issuedSuggestions).toBe(1);
    expect(result.keptUnedited).toBe(1);
    expect(result.keptUneditedRate).toBe(1);
  });

  it('does not count a suggestion the Creator edited before saving', async () => {
    const post = await makePost({ excerpt: 'Edited by the Creator' });
    await makeSuggestion({ post: post._id, text: 'Original suggestion' });

    const result = await computeKeptUnedited(30);
    expect(result.issuedSuggestions).toBe(1);
    expect(result.keptUnedited).toBe(0);
    expect(result.keptUneditedRate).toBe(0);
  });

  it('excludes suggestions issued outside the window', async () => {
    const post = await makePost({ excerpt: 'Exact match' });
    await makeSuggestion({
      post: post._id,
      text: 'Exact match',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    });

    const result = await computeKeptUnedited(30);
    expect(result.issuedSuggestions).toBe(0);
    expect(result.keptUneditedRate).toBeNull();
  });
});
