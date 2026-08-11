import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import PostView, { startOfUtcDay } from '../models/PostView';
import {
  recordExcerptSuggestion,
  claimOrphanSuggestion,
} from '../reporting/excerptSuggestionRecord';
import { AuthRequest } from '../middleware/auth';
import { badRequest, forbidden, notFound, validationFailed } from '../errors';
import {
  postSchema,
  updatePostSchema,
  suggestExcerptSchema,
} from '../schemas/posts';
import { computeReadTime, deriveExcerpt } from '../utils/postContent';
import { suggestExcerpt } from '../ai/excerptSuggestion';
import { resolveGenerateText } from '../ai/provider';

// $regex compiles its input as a pattern, so a search term must be escaped or the
// Creator's own text becomes syntax: `c++` is a malformed pattern MongoDB rejects,
// and `.*` would match every Post.
const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateUniqueSlug = async (
  title: string,
  excludeId?: string
): Promise<string> => {
  let base = title
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');

  if (!base) {
    base = 'post';
  }

  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await Post.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === excludeId)) {
      break;
    }
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
};

// Category and search narrow a list the same way for both audiences; who may
// see which Posts is decided by the caller, not here.
const applyListFilters = (
  filter: Record<string, unknown>,
  query: Request['query']
): void => {
  const { category, search } = query;

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (typeof search === 'string' && search) {
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
  }
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

  applyListFilters(filter, req.query);

  const posts = await Post.find(filter)
    .select('-coverImage')
    .sort({ createdAt: -1 });
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
  applyListFilters(filter, req.query);

  const posts = await Post.find(filter)
    .select('-coverImage -owner')
    .sort({ createdAt: -1 });
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
  if (!post) {
    throw notFound('Post not found');
  }
  res.json(post);
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

  const slug = await generateUniqueSlug(title);

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

  await post.save();
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

  if (data.title !== undefined) {
    post.title = data.title;
    post.slug = await generateUniqueSlug(data.title, String(post._id));
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
    console.error(
      'Suggest excerpt error, falling back to derived excerpt:',
      error
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

  await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });
  // The Post's counter answers "how many"; the daily rollup answers "when",
  // which is what the Creator's weekly trend is made of.
  await PostView.updateOne(
    { post: post._id, day: startOfUtcDay(new Date()) },
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
  res.json({ message: 'Post deleted successfully' });
};
