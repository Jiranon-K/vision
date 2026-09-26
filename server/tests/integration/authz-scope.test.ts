import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import type { CommandStartedEvent } from 'mongodb';
import { cookiesOf, setupTestApp } from '../support/testApp';

const testApp = setupTestApp({ connect: { monitorCommands: true }, syncIndexes: true });
const { api } = testApp;

let Post: typeof import('../../src/modules/posts/post.model').default;
let policy: typeof import('../../src/modules/posts/policy');
let READER: typeof import('../../src/modules/auth/actor').READER;

const commands: CommandStartedEvent[] = [];

beforeAll(async () => {
  mongoose.connection.getClient().on('commandStarted', (event) => {
    commands.push(event);
  });
  Post = (await import('../../src/modules/posts/post.model')).default;
  policy = await import('../../src/modules/posts/policy');
  ({ READER } = await import('../../src/modules/auth/actor'));
});

const ALICE = new mongoose.Types.ObjectId();
const BOB = new mongoose.Types.ObjectId();

async function seedFixture(): Promise<void> {
  let n = 0;
  for (const owner of [ALICE, BOB]) {
    for (const status of ['Draft', 'Published'] as const) {
      for (const withheld of [false, true, 'unset'] as const) {
        n++;
        const created = await Post.create({
          title: `Post ${n}`,
          excerpt: 'e',
          content: 'c',
          category: 'SEO',
          status,
          owner,
          author: { name: 'n' },
          readTime: '1 min read',
          slug: `post-${n}`,
          withheld: withheld === true,
        });
        if (withheld === 'unset') {
          await Post.collection.updateOne({ _id: created._id }, { $unset: { withheld: '' } });
        }
      }
    }
  }
}

const register = async (email: string) => cookiesOf(await testApp.register(email));

const postCommands = () =>
  commands.filter(
    (c) => (c.command as Record<string, unknown>)[c.commandName] === 'posts'
  );

describe('the listing scope and the point check agree', () => {
  it('selects exactly the Posts the point check admits, for every kind of actor', async () => {
    await seedFixture();
    const everything = await Post.find().lean();

    const actors = [
      READER,
      { kind: 'creator', id: String(ALICE) },
      { kind: 'admin', id: String(BOB) },
    ] as const;

    for (const actor of actors) {
      const scoped = await Post.find(policy.listScope(actor)).lean();
      const admitted = everything.filter((p) => policy.can(actor, 'list', p));

      const ids = (rows: { _id: unknown }[]) => rows.map((r) => String(r._id)).sort();
      expect(ids(scoped), actor.kind).toEqual(ids(admitted));
      expect(admitted.length, actor.kind).toBeGreaterThan(0);
    }
  });

  it('agrees for a Reader on reading as well as listing', async () => {
    await seedFixture();
    const everything = await Post.find().lean();
    const scoped = await Post.find(policy.listScope(READER)).lean();
    const readable = everything.filter((p) => policy.can(READER, 'read', p));
    expect(scoped.map((p) => String(p._id)).sort()).toEqual(
      readable.map((p) => String(p._id)).sort()
    );
  });
});

describe('a listing costs the same however many Posts it returns', () => {
  it('serves the Hub listing with one query', async () => {
    const cookies = await register('count-hub@test.local');
    for (let i = 0; i < 5; i++) {
      await api()
        .post('/api/posts')
        .set('Cookie', cookies)
        .send({ title: `T${i}`, content: 'body text', category: 'SEO', status: 'Draft' });
    }

    commands.length = 0;
    const res = await api().get('/api/posts').set('Cookie', cookies);
    expect(res.body.items).toHaveLength(5);
    expect(postCommands().map((c) => c.commandName)).toEqual(['find']);
  });

  it('serves the public listing with one query', async () => {
    await seedFixture();

    commands.length = 0;
    const res = await api().get('/api/posts/public');
    expect(res.body.items).toHaveLength(4);
    expect(postCommands().map((c) => c.commandName)).toEqual(['find']);
  });
});

describe('the public listing is still served by its index', () => {
  it('answers with an index scan on { status, createdAt }', async () => {
    await seedFixture();

    commands.length = 0;
    await api().get('/api/posts/public');
    const [find] = postCommands();
    const { filter, sort } = find.command as {
      filter: Record<string, unknown>;
      sort: Record<string, 1 | -1>;
    };

    const plan = await mongoose.connection
      .db!.collection('posts')
      .find(filter)
      .sort(sort)
      .explain('queryPlanner');

    const stages: { stage?: string; indexName?: string }[] = [];
    const walk = (node: Record<string, unknown> | undefined): void => {
      if (!node) return;
      stages.push(node as { stage?: string; indexName?: string });
      walk(node.inputStage as Record<string, unknown> | undefined);
      for (const child of (node.inputStages as Record<string, unknown>[]) ?? []) walk(child);
    };
    const winning = (plan.queryPlanner as { winningPlan: Record<string, unknown> }).winningPlan;
    walk((winning.queryPlan as Record<string, unknown>) ?? winning);

    const scan = stages.find((s) => s.stage === 'IXSCAN');
    expect(scan?.indexName).toBe('status_1_createdAt_-1');
    expect(stages.some((s) => s.stage === 'COLLSCAN')).toBe(false);
  });
});
