import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import PostView, { startOfUtcDay } from '../models/PostView';
import ViewRecord from '../models/ViewRecord';
import {
  VIEW_DEDUPE_WINDOW_HOURS,
  deriveReader,
  looksLikeCrawler,
} from '../utils/readerIdentity';
import {
  recordExcerptSuggestion,
  claimOrphanSuggestion,
} from '../reporting/excerptSuggestionRecord';
import { AuthRequest } from '../middleware/auth';
import { badRequest, forbidden, notFound, validationFailed } from '../errors';
import { logger } from '../logger';
import {
  postSchema,
  updatePostSchema,
  suggestExcerptSchema,
} from '../schemas/posts';
import { computeReadTime, deriveExcerpt } from '../utils/postContent';
import {
  normalizeSlug,
  proposeSlug,
  saveWithUniqueSlug,
  slugIsTaken,
} from '../utils/slug';
import { isDuplicateKeyError } from '../utils/duplicateKey';
import { suggestExcerpt } from '../ai/excerptSuggestion';
import { resolveGenerateText } from '../ai/provider';

// The Creator's own text must never be read as syntax: a term is a phrase to
// match, not an expression to evaluate. `$text` treats a quoted string as a
// literal phrase, so quoting is both the escaping and the "these words, in this
// order" behaviour a Creator expects when they type more than one word.
const asPhrase = (term: string): string => `"${term.replace(/"/g, ' ')}"`;

// A term of one or two characters is an in-progress query, not a search. Left
// unfiltered it would return the whole collection on every keystroke.
const MIN_SEARCH_LENGTH = 2;

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
  filter: Record<string, unknown>,
  query: Request['query']
): ListShape => {
  const { category, search } = query;

  if (category && category !== 'All') {
    filter.category = category;
  }

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

// The Smart Creator Hub's list: the Posts this Creator owns, Draft and
// Published alike. Ownership is a filter rather than a check — a filter applied
// after the query has already pulled every Creator's Drafts into the process.
export const getPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const filter: Record<string, unknown> = {};

  // Moderation depends on an admin seeing across Creators, so the role widens
  // the constraint rather than skipping it.
  if (req.user!.role !== 'admin') {
    filter.owner = req.user!.id;
  }

  const { status } = req.query;
  if (status && status !== 'All') {
    filter.status = status;
  }

  const shape = applyListFilters(filter, req.query);

  const posts = await Post.find(shape.filter)
    .select('-coverImage')
    .sort(shape.sort);
  res.json(posts);
};

// The Reader's list. It takes no session into account at all: branching on
// whether one happened to be present is what let a signed-in Creator read every
// other Creator's Drafts. Owner ids never cross this boundary.
export const getPublicPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const filter: Record<string, unknown> = { status: 'Published' };
  const shape = applyListFilters(filter, req.query);

  const posts = await Post.find(shape.filter)
    .select('-coverImage -owner')
    .sort(shape.sort);
  res.json(posts);
};

export const getPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const post = await Post.findById(req.params.id);
  // A Post the caller neither owns nor can read publicly answers as missing:
  // a distinct refusal would confirm the id exists.
  const canRead =
    post &&
    (post.status === 'Published' ||
      (req.user &&
        (req.user.role === 'admin' || String(post.owner) === req.user.id)));
  if (!canRead) {
    throw notFound('Post not found');
  }
  res.json(post);
};

export const getPostBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  const post = await Post.findOne({
    slug: req.params.slug,
    status: 'Published',
  });
  if (post) {
    res.json(post);
    return;
  }

  // A retained address answers with a permanent redirect rather than failing,
  // so a bookmark or a link already broadcast to a channel keeps working and
  // search engines learn the new address.
  const moved = await Post.findOne({
    previousSlugs: req.params.slug,
    status: 'Published',
  }).select('slug');
  if (moved) {
    res
      .status(301)
      .location(`/api/posts/slug/${encodeURIComponent(moved.slug)}`)
      .json({ slug: moved.slug });
    return;
  }

  throw notFound('Post not found');
};

export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const validation = postSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }

  const { title, excerpt, content, category, status, featured, coverImage } =
    validation.data;

  const slug = validation.data.slug
    ? normalizeSlug(validation.data.slug)
    : await proposeSlug(title);

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
    owner: req.user!.id,
    author: {
      name: req.user?.name || 'Unknown Author',
      role: req.user?.role === 'admin' ? 'Admin' : 'Author',
    },
  });

  if (validation.data.slug && (await slugIsTaken(slug))) {
    throw badRequest('That address is already taken by another Post');
  }

  await saveWithUniqueSlug(post, title);
  await claimOrphanSuggestion(
    req.user!.id,
    post._id as mongoose.Types.ObjectId
  );
  res.status(201).json(post);
};

export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const validation = updatePostSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    throw notFound('Post not found');
  }

  if (req.user!.role !== 'admin' && String(post.owner) !== req.user!.id) {
    throw forbidden('You do not have permission to edit this post');
  }

  // Adopt ownership of a legacy post that predates the owner field (only an
  // admin reaches here for an orphan; authors are rejected above). Prevents a
  // required-field validation error on save before the backfill migration runs.
  if (!post.owner) {
    post.owner = new mongoose.Types.ObjectId(req.user!.id);
  }

  const data = validation.data;
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

  res.json(post);
};

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

export const suggestPostExcerpt = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const validation = suggestExcerptSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationFailed(validation.error.issues);
  }

  const { content, postId } = validation.data;

  const generateText = resolveGenerateText();
  if (!generateText) {
    res.status(503).json({ error: 'Excerpt suggestions are not available' });
    return;
  }

  try {
    const excerpt = await withTimeout(
      suggestExcerpt(content, generateText),
      SUGGESTION_TIMEOUT_MS
    );
    await recordExcerptSuggestion({
      creatorId: req.user!.id,
      postId,
      text: excerpt,
      source: 'provider',
    });
    // "provider": this suggestion came from the injected provider call, as
    // opposed to the derived fallback below.
    res.json({ excerpt, source: 'provider' });
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
      creatorId: req.user!.id,
      postId,
      text: excerpt,
      source: 'fallback',
    });
    res.json({ excerpt, source: 'fallback' });
  }
};

export const incrementViews = async (
  req: Request,
  res: Response
): Promise<void> => {
  // A malformed id is the caller's mistake; a failure to write is the
  // server's. Catching everything and calling it "Invalid id" blended the two.
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw badRequest('Invalid id');
  }

  const post = await Post.findById(req.params.id).select('owner status');
  if (!post) {
    throw notFound('Post not found');
  }
  // A Draft has no Readers, so it accumulates no Views. Previously this
  // incremented whatever id it was handed, without checking that a Reader
  // could have read it.
  if (post.status !== 'Published') {
    res.status(204).end();
    return;
  }

  // Indexing is not readership. Answered as success so a crawler learns
  // nothing from the difference.
  if (looksLikeCrawler(req)) {
    res.status(204).end();
    return;
  }

  const now = new Date();
  const reader = deriveReader(req, now);
  const expiresAt = new Date(
    now.getTime() + VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000
  );

  try {
    await ViewRecord.create({ post: post._id, reader, expiresAt });
  } catch (error) {
    // The unique index rejecting the row is the deduplication: this Reader has
    // already been counted for this Post inside the window. Accepted and
    // ignored rather than refused, so the client needs no logic to interpret it.
    if (isDuplicateKeyError(error)) {
      res.status(204).end();
      return;
    }
    throw error;
  }

  await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  // The Post's counter answers "how many"; the daily rollup answers "when",
  // which is what the Creator's weekly trend is made of.
  await PostView.updateOne(
    { post: post._id, day: startOfUtcDay(now) },
    { $inc: { count: 1 }, $setOnInsert: { owner: post.owner } },
    { upsert: true }
  );
  res.status(204).end();
};

export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw notFound('Post not found');
  }

  if (req.user!.role !== 'admin' && String(post.owner) !== req.user!.id) {
    throw forbidden('You do not have permission to delete this post');
  }

  await post.deleteOne();
  // Totals describe Posts that exist, so the rollup goes with the Post.
  await PostView.deleteMany({ post: post._id });
  await ViewRecord.deleteMany({ post: post._id });
  res.json({ message: 'Post deleted successfully' });
};
