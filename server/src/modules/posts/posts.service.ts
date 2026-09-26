import type { Request } from 'express';
import mongoose from 'mongoose';
import Post from './post.model';
import { User, READER, type Actor } from '../auth';
import { recordView, forgetViews } from '../analytics';
import { deliverPost } from '../followers';
import {
  recordExcerptSuggestion,
  claimOrphanSuggestion,
  suggestExcerpt,
  resolveGenerateText,
} from '../excerpt-suggestion';
import { badRequest, notFound, validationFailed } from '../../platform/errors';
import {
  actionsForUpdate,
  advertisedActions,
  authorize,
  can,
  listScope,
} from './policy';
import { logger } from '../../platform/logger';
import {
  postSchema,
  updatePostSchema,
  suggestExcerptSchema,
  withholdSchema,
} from './posts.schema';
import { computeReadTime, deriveExcerpt } from './content';
import {
  normalizeSlug,
  proposeSlug,
  saveWithUniqueSlug,
  slugIsTaken,
} from './slug';
import {
  encodeCursor,
  readCursor,
  readLimit,
  type Cursor,
} from '../../platform/pagination';

// The rules of Posts, with no HTTP in them: who may see and change which Post,
// how a list is scoped, filtered, searched and paged, how a Slug is assigned and
// protected, and what is derived from content. Every function takes the actor
// first and throws the errors of platform/errors.ts for the edge to render.

/** A list's query string as the caller received it: status, category, search, limit, cursor. */
export type ListQuery = Request['query'];

/** A Post as it leaves the module: its JSON, plus the actions the actor may take on it. */
export type PresentedPost = Record<string, unknown>;

export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

// The Creator's own text must never be read as syntax: a term is a phrase to
// match, not an expression to evaluate. `$text` treats a quoted string as a
// literal phrase, so quoting is both the escaping and the "these words, in this
// order" behaviour a Creator expects when they type more than one word.
const asPhrase = (term: string): string => `"${term.replace(/"/g, ' ')}"`;

// A term of one or two characters is an in-progress query, not a search. Left
// unfiltered it would return the whole collection on every keystroke.
export const MIN_SEARCH_LENGTH = 2;

// The score is sorted by but never returned: it is a ranking mechanism, not
// part of what a Post is, and MongoDB has allowed a $meta sort without a
// matching projection since 4.4.
type SortSpec = Record<string, 1 | -1 | { $meta: 'textScore' }>;

interface ListShape {
  filter: Record<string, unknown>;
  sort: SortSpec;
}

// Category and search narrow a list the same way for both audiences; who may
// see which Posts is decided by the caller, not here.
const applyListFilters = (
  scope: Record<string, unknown>,
  narrowing: Record<string, unknown>,
  query: ListQuery
): ListShape => {
  const { category, search } = query;

  if (category && category !== 'All') {
    narrowing = { ...narrowing, category };
  }

  const collides = Object.keys(narrowing).some((key) => key in scope);
  const filter: Record<string, unknown> = collides
    ? { $and: [scope, narrowing] }
    : { ...scope, ...narrowing };

  const term = typeof search === 'string' ? search.trim() : '';
  if (term.length < MIN_SEARCH_LENGTH) {
    return { filter, sort: { createdAt: -1 } };
  }

  // Relevance orders the result; recency breaks ties. Relevance alone makes two
  // equally good matches arbitrary; recency alone is what the old behaviour got
  // wrong.
  filter.$text = { $search: asPhrase(term) };
  return {
    filter,
    sort: { score: { $meta: 'textScore' }, createdAt: -1 },
  };
};

// The listing representation, named rather than "the full Post with fields
// removed": naming it makes an accidental addition visible, where subtracting
// from a full record invites the next person to add one back. `content` is
// excluded at the database — projecting is what makes the request cheap;
// loading and discarding only makes the response smaller.
const LISTING_FIELDS = '-content -coverImage';

const ACCESS_FIELDS = 'owner status withheld';

type PostDocument = InstanceType<typeof Post>;

function present(post: PostDocument, actor: Actor): PresentedPost {
  const permissions = advertisedActions(actor, post);
  const { withheld, ...body } = post.toJSON() as Record<string, unknown>;
  return permissions ? { ...body, withheld, permissions } : body;
}

/**
 * One page of a listing, plus how to ask for the next. No total count: counting
 * the whole collection on every page defeats the purpose of paginating it.
 */
async function listPage(
  filter: Record<string, unknown>,
  sort: SortSpec,
  select: string,
  limit: number,
  cursor?: Cursor
): Promise<Page<PostDocument>> {
  const searching = 'score' in sort;

  const query = Post.find(searching ? filter : withCursor(filter, cursor))
    .select(select)
    .sort(sort)
    // One more than asked for, so "is there another page" needs no second query.
    .limit(limit + 1);

  if (searching && cursor?.kind === 'offset') {
    query.skip(cursor.offset);
  }

  const rows = await query;
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  if (!hasMore) {
    return { items };
  }

  if (searching) {
    const offset = (cursor?.kind === 'offset' ? cursor.offset : 0) + limit;
    return { items, nextCursor: encodeCursor({ kind: 'offset', offset }) };
  }

  const last = items[items.length - 1];
  return {
    items,
    nextCursor: encodeCursor({
      kind: 'created',
      createdAt: last.createdAt as Date,
      id: String(last._id),
    }),
  };
}

// Newest first, with the id breaking a tie, so a cursor is unambiguous even
// when two Posts share a creation timestamp.
function withCursor(
  filter: Record<string, unknown>,
  cursor?: Cursor
): Record<string, unknown> {
  if (cursor?.kind !== 'created') return filter;
  return {
    ...filter,
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ],
  };
}

// The Smart Creator Hub's list: the Posts this actor may list, Draft and
// Published alike. Ownership is a filter rather than a check — a filter applied
// after the query has already pulled every Creator's Drafts into the process.
export async function listPosts(
  actor: Actor,
  query: ListQuery
): Promise<Page<PresentedPost>> {
  const narrowing: Record<string, unknown> = {};

  const { status } = query;
  if (status && status !== 'All') {
    narrowing.status = status;
  }

  const shape = applyListFilters(listScope(actor), narrowing, query);

  const page = await listPage(
    shape.filter,
    shape.sort,
    LISTING_FIELDS,
    readLimit(query),
    readCursor(query)
  );
  return { ...page, items: page.items.map((post) => present(post, actor)) };
}

// The Reader's list. It takes no session into account at all: branching on
// whether one happened to be present is what let a signed-in Creator read every
// other Creator's Drafts. Owner ids never cross this boundary.
export async function listPublishedPosts(
  query: ListQuery
): Promise<Page<PresentedPost>> {
  const shape = applyListFilters(listScope(READER), {}, query);

  const page = await listPage(
    shape.filter,
    shape.sort,
    `${LISTING_FIELDS} -owner -withheld`,
    readLimit(query),
    readCursor(query)
  );
  return {
    ...page,
    items: page.items.map((post) => post.toJSON() as PresentedPost),
  };
}

export async function getPost(actor: Actor, id: string): Promise<PresentedPost> {
  const post = await Post.findById(id);
  authorize(actor, 'read', post);
  return present(post, actor);
}

/**
 * The Published Post a Reader reaches at this address — or, when the address
 * is one a Post used to answer at, the Slug it answers at now.
 */
export async function getPublishedBySlug(
  slug: string
): Promise<{ post: PresentedPost } | { movedTo: string }> {
  const post = await Post.findOne({ ...listScope(READER), slug });
  if (post) {
    return { post: present(post, READER) };
  }

  // A retained address stays reachable, so a bookmark or a link already
  // broadcast to a channel keeps working.
  const moved = await Post.findOne({
    ...listScope(READER),
    previousSlugs: slug,
  }).select('slug');
  if (moved) {
    return { movedTo: moved.slug };
  }

  throw notFound('Post not found');
}

/**
 * The Creator's name comes from the session rather than the actor, which
 * carries only who they are, not what they are called.
 */
export async function createPost(
  actor: Actor,
  input: unknown,
  creatorName: string | undefined
): Promise<PresentedPost> {
  const validation = postSchema.safeParse(input);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }
  // The route admits only signed-in Creators; a Reader reaching this is a
  // wiring mistake, answered as a Post nobody may see.
  if (actor.kind === 'reader') throw notFound('Post not found');

  const { title, excerpt, content, category, status, featured, coverImage } =
    validation.data;

  const [slug, creator] = await Promise.all([
    validation.data.slug
      ? normalizeSlug(validation.data.slug)
      : proposeSlug(title),
    User.findById(actor.id).select('profile.byline'),
  ]);
  const byline = creator?.profile?.byline;

  const post = new Post({
    title,
    excerpt: deriveExcerpt(content, excerpt),
    content,
    category,
    status,
    readTime: computeReadTime(content),
    featured: featured || false,
    coverImage,
    slug,
    owner: actor.id,
    author: {
      name: creatorName || 'Unknown Creator',
      ...(byline ? { byline } : {}),
    },
  });

  if (validation.data.slug && (await slugIsTaken(slug))) {
    throw badRequest('That address is already taken by another Post');
  }

  await saveWithUniqueSlug(post, title);
  await claimOrphanSuggestion(actor.id, post._id as mongoose.Types.ObjectId);
  await deliverIfChosen(post, validation.data.deliver);
  return present(post, actor);
}

export async function updatePost(
  actor: Actor,
  id: string,
  input: unknown
): Promise<PresentedPost> {
  const validation = updatePostSchema.safeParse(input);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }

  const post = await Post.findById(id);
  authorize(actor, 'edit', post);

  const data = validation.data;
  for (const action of actionsForUpdate(post, data)) {
    authorize(actor, action, post);
  }
  const wasPublished = post.status === 'Published';

  if (data.title !== undefined) {
    post.title = data.title;
    // A Draft's address follows its title, because a Draft has no Readers and
    // no indexed URL. Once Published the two are independent: regenerating the
    // Slug from a retitled headline threw away every link pointing at it.
    if (!wasPublished) {
      post.slug = await proposeSlug(data.title, String(post._id));
    }
  }

  // An address a Creator sets deliberately is the one case a Published Slug
  // moves. The old one is retained so links already shared keep working.
  if (data.slug !== undefined) {
    const nextSlug = normalizeSlug(data.slug);
    if (nextSlug !== post.slug) {
      if (await slugIsTaken(nextSlug, String(post._id))) {
        throw badRequest('That address is already taken by another Post');
      }
      if (wasPublished) {
        post.previousSlugs = [...(post.previousSlugs ?? []), post.slug];
      }
      post.slug = nextSlug;
    }
  }
  if (data.content !== undefined) post.content = data.content;
  if (data.category !== undefined) post.category = data.category;
  if (data.status !== undefined) post.status = data.status;
  if (data.featured !== undefined) post.featured = data.featured;
  if (data.coverImage !== undefined) post.coverImage = data.coverImage;

  // Recompute derived fields whenever the source content changes; re-derive the
  // excerpt when content changed or a new excerpt was supplied (blank → auto).
  if (data.content !== undefined) {
    post.readTime = computeReadTime(post.content);
  }
  if (data.content !== undefined || data.excerpt !== undefined) {
    post.excerpt = deriveExcerpt(post.content, data.excerpt);
  }

  await post.save();

  const publishing = !wasPublished && post.status === 'Published';
  if (publishing) await deliverIfChosen(post, data.deliver);

  return present(post, actor);
}

// Delivers a Post that has just become Published, when the Creator chose to.
// Never fails the publish: the Post is saved first, and a Delivery that could
// not be queued is logged rather than surfaced (ADR 0002's rule, for email).
async function deliverIfChosen(post: PostDocument, deliver: boolean | undefined): Promise<void> {
  if (!deliver || post.status !== 'Published' || post.withheld || post.delivery) return;
  try {
    const delivery = await deliverPost({
      postId: post._id as mongoose.Types.ObjectId,
      creatorId: String(post.owner),
      content: {
        creatorName: post.author.name,
        byline: post.author.byline,
        title: post.title,
        excerpt: post.excerpt,
        readTime: post.readTime,
        coverImage: post.coverImage,
        slug: post.slug,
      },
    });
    if (!delivery) return;
    post.delivery = delivery;
    await Post.updateOne({ _id: post._id }, { $set: { delivery } });
  } catch (error) {
    logger.error({ err: error, post: String(post._id) }, 'Delivery could not be queued');
  }
}

export async function deletePost(actor: Actor, id: string): Promise<void> {
  const post = await Post.findById(id);
  authorize(actor, 'delete', post);

  await post.deleteOne();
  await forgetViews(post._id);
}

export async function withholdPost(
  actor: Actor,
  id: string,
  input: unknown
): Promise<PresentedPost> {
  const validation = withholdSchema.safeParse(input);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }

  const post = await Post.findById(id).select(ACCESS_FIELDS);
  authorize(actor, 'withhold', post);
  // authorize admits only an Admin to withhold; the narrowing is for the type.
  if (actor.kind === 'reader') throw notFound('Post not found');

  await Post.updateOne(
    { _id: post._id, withheld: { $ne: true } },
    {
      $set: { withheld: true },
      $push: {
        withholdings: {
          by: actor.id,
          at: new Date(),
          reason: validation.data.reason,
        },
      },
    }
  );
  post.withheld = true;
  return present(post, actor);
}

export async function restorePost(
  actor: Actor,
  id: string
): Promise<PresentedPost> {
  const post = await Post.findById(id).select(ACCESS_FIELDS);
  authorize(actor, 'restore', post);
  if (actor.kind === 'reader') throw notFound('Post not found');

  await Post.updateOne(
    { _id: post._id, withheld: true },
    {
      $set: {
        withheld: false,
        'withholdings.$[open].liftedBy': actor.id,
        'withholdings.$[open].liftedAt': new Date(),
      },
    },
    { arrayFilters: [{ 'open.liftedAt': { $exists: false } }] }
  );
  post.withheld = false;
  return present(post, actor);
}

/**
 * Counts a Reader's visit to a Post, when it was one. The request identifies
 * the Reader for deduplication; nothing else is read from it.
 */
export async function viewPost(
  id: string,
  visit: Request,
  { fromDelivery = false }: { fromDelivery?: boolean } = {}
): Promise<void> {
  // A malformed id is the caller's mistake; a failure to write is the
  // server's. Catching everything and calling it "Invalid id" blended the two.
  if (!mongoose.isValidObjectId(id)) {
    throw badRequest('Invalid id');
  }

  const post = await Post.findById(id).select(ACCESS_FIELDS);
  if (!post) {
    throw notFound('Post not found');
  }
  // A Draft has no Readers, so it accumulates no Views. Previously this
  // incremented whatever id it was handed, without checking that a Reader
  // could have read it.
  if (!can(READER, 'read', post)) return;

  // Whether this was a View is Analytics' question; the Post only keeps the total.
  if (await recordView(post, visit, { fromDelivery })) {
    await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  }
}

// A provider that hangs must not hang the Creator's editor with it. 8s is
// generous for a text summary call but bounds the worst case to "annoying"
// rather than "stuck forever". Overridable so tests can exercise the timeout
// path without actually waiting 8s.
const SUGGESTION_TIMEOUT_MS =
  Number(process.env.AI_SUGGESTION_TIMEOUT_MS) || 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Excerpt suggestion timed out')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export interface PostExcerptSuggestion {
  excerpt: string;
  // "provider": the injected provider call wrote it. "fallback": it is the
  // mechanical derivation the save path uses.
  source: 'provider' | 'fallback';
}

/**
 * An Excerpt for content the Creator is writing, or `undefined` when no
 * provider is configured and suggestions are not offered at all.
 */
export async function suggestPostExcerpt(
  actor: Actor,
  input: unknown
): Promise<PostExcerptSuggestion | undefined> {
  const validation = suggestExcerptSchema.safeParse(input);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }
  if (actor.kind === 'reader') throw notFound('Post not found');

  const { content, postId } = validation.data;

  const generateText = resolveGenerateText();
  if (!generateText) return undefined;

  try {
    const excerpt = await withTimeout(
      suggestExcerpt(content, generateText),
      SUGGESTION_TIMEOUT_MS
    );
    await recordExcerptSuggestion({
      creatorId: actor.id,
      postId,
      text: excerpt,
      source: 'provider',
    });
    return { excerpt, source: 'provider' };
  } catch (error) {
    // A failing or slow provider must not fail the request (it would just
    // train the Creator to distrust the button) — fall back to the same
    // mechanical derivation the save path uses, and say so via "source" so
    // the editor never passes a truncated string off as the AI's work.
    logger.error(
      { err: error },
      'Suggest excerpt error, falling back to derived excerpt'
    );
    const excerpt = deriveExcerpt(content);
    await recordExcerptSuggestion({
      creatorId: actor.id,
      postId,
      text: excerpt,
      source: 'fallback',
    });
    return { excerpt, source: 'fallback' };
  }
}
