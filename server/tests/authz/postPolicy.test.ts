import { describe, it, expect } from 'vitest';
import {
  READER,
  actorFrom,
  authorize,
  can,
  type Actor,
  type PostResource,
} from '../../src/authz/postPolicy';
import { HttpError } from '../../src/errors';

const ALICE = '64b000000000000000000001';
const BOB = '64b000000000000000000002';

const creator = (id: string): Actor => ({ kind: 'creator', id });
const admin = (id: string): Actor => ({ kind: 'admin', id });

const post = (over: Partial<PostResource> = {}): PostResource => ({
  owner: ALICE,
  status: 'Draft',
  ...over,
});

describe('the point check', () => {
  it('lets a Creator do everything to their own Post', () => {
    for (const action of ['read', 'edit', 'publish', 'delete'] as const) {
      expect(can(creator(ALICE), action, post())).toBe(true);
    }
  });

  it('lets a Creator read another Creator’s Published Post, and nothing more', () => {
    const theirs = post({ status: 'Published' });
    expect(can(creator(BOB), 'read', theirs)).toBe(true);
    expect(can(creator(BOB), 'edit', theirs)).toBe(false);
    expect(can(creator(BOB), 'delete', theirs)).toBe(false);
  });

  it('hides another Creator’s Draft from a Creator', () => {
    expect(can(creator(BOB), 'read', post())).toBe(false);
  });

  it('lets a Reader read a Published Post and never a Draft', () => {
    expect(can(READER, 'read', post({ status: 'Published' }))).toBe(true);
    expect(can(READER, 'read', post())).toBe(false);
    expect(can(READER, 'edit', post({ status: 'Published' }))).toBe(false);
  });

  it('lets an Admin read any Post, Drafts included', () => {
    expect(can(admin(BOB), 'read', post())).toBe(true);
  });

  it('never lets an Admin change or destroy another Creator’s Post', () => {
    for (const status of ['Draft', 'Published'] as const) {
      for (const action of ['edit', 'publish', 'delete'] as const) {
        expect(can(admin(BOB), action, post({ status })), `${action} ${status}`).toBe(false);
      }
    }
  });

  it('lets an Admin do everything to a Post of their own', () => {
    for (const action of ['edit', 'publish', 'delete'] as const) {
      expect(can(admin(ALICE), action, post())).toBe(true);
    }
  });

  it('lets only an Admin withhold a Published Post, and lift it again', () => {
    const published = post({ status: 'Published' });
    const withheld = post({ status: 'Published', withheld: true });
    expect(can(admin(BOB), 'withhold', published)).toBe(true);
    expect(can(admin(BOB), 'restore', withheld)).toBe(true);
    expect(can(admin(BOB), 'withhold', withheld)).toBe(false);
    expect(can(admin(BOB), 'withhold', post())).toBe(false);
    expect(can(creator(ALICE), 'withhold', published)).toBe(false);
    expect(can(creator(ALICE), 'restore', withheld)).toBe(false);
  });

  it('lets an Admin withhold and lift a Post of their own too', () => {
    expect(can(admin(ALICE), 'withhold', post({ status: 'Published' }))).toBe(true);
    expect(can(admin(ALICE), 'restore', post({ status: 'Published', withheld: true }))).toBe(true);
  });

  it('hides a Withheld Post from Readers and other Creators, not from its own', () => {
    const withheld = post({ status: 'Published', withheld: true });
    expect(can(READER, 'read', withheld)).toBe(false);
    expect(can(creator(BOB), 'read', withheld)).toBe(false);
    expect(can(creator(ALICE), 'read', withheld)).toBe(true);
    expect(can(creator(ALICE), 'edit', withheld)).toBe(true);
    expect(can(admin(BOB), 'read', withheld)).toBe(true);
  });

  it('compares owner ids by value, whatever type they arrive as', () => {
    const owned = post({ owner: { toString: () => ALICE } });
    expect(can(creator(ALICE), 'edit', owned)).toBe(true);
  });

  it('admits no one to change a Post with no owner', () => {
    expect(can(creator(ALICE), 'edit', post({ owner: undefined }))).toBe(false);
    expect(can(admin(ALICE), 'edit', post({ owner: undefined }))).toBe(false);
  });
});

describe('a refusal carries its own mode', () => {
  const refusal = (fn: () => void): HttpError => {
    try {
      fn();
    } catch (error) {
      return error as HttpError;
    }
    throw new Error('expected a refusal');
  };

  it('refuses to read another Creator’s Draft as missing, not forbidden', () => {
    expect(refusal(() => authorize(creator(BOB), 'read', post())).status).toBe(404);
  });

  it('refuses an action on a Post as forbidden', () => {
    const theirs = post({ status: 'Published' });
    expect(refusal(() => authorize(creator(BOB), 'edit', theirs)).status).toBe(403);
    expect(refusal(() => authorize(creator(BOB), 'delete', theirs)).status).toBe(403);
  });

  it('answers a missing Post as missing whatever the action', () => {
    expect(refusal(() => authorize(creator(BOB), 'edit', null)).status).toBe(404);
  });

  it('says nothing when the action is allowed', () => {
    expect(() => authorize(creator(ALICE), 'edit', post())).not.toThrow();
  });
});

describe('the actor is decided once, at the edge', () => {
  it('makes an absent session an explicit Reader', () => {
    expect(actorFrom(undefined)).toEqual(READER);
  });

  it('reads the stored role into a kind of actor', () => {
    expect(actorFrom({ id: ALICE, role: 'admin' })).toEqual(admin(ALICE));
    expect(actorFrom({ id: ALICE, role: 'creator' })).toEqual(creator(ALICE));
  });

  it('refuses a role it does not recognise rather than guessing', () => {
    expect(() => actorFrom({ id: ALICE, role: 'superuser' })).toThrow();
  });
});
