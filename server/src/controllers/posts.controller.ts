import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import ExcerptSuggestion from '../models/ExcerptSuggestion';
import { AuthRequest } from '../middleware/auth';
import { postSchema, updatePostSchema, suggestExcerptSchema } from '../schemas/posts';
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

export const getPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { category, status, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    // Unauthenticated callers (e.g. the public blog) may only ever see published
    // posts — never expose Draft content or owner ids to anonymous requests.
    if (!req.user) {
      filter.status = 'Published';
    }

    if (typeof search === 'string' && search) {
      filter.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    const posts = await Post.find(filter)
      .select('-coverImage')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    // Hide unpublished drafts from anonymous callers (the dashboard sends creds).
    if (!req.user && post.status !== 'Published') {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPostBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      status: 'Published',
    });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// A Creator asks for a suggestion while writing, which is before the Post
// exists — so the record has no Post to point at, and both thresholds in
// docs/excerpt-suggestion-metrics.md would read near zero no matter how many
// Creators used the button. Claiming those orphans for the Post the same
// Creator just created is what keeps the numbers answerable.
//
// This is a write to the measurement collection, not a provider call, so ADR
// 0002 still holds: creating a Post reaches no provider. It must never fail a
// save either — the Post is already persisted by the time this runs.
const ORPHAN_CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;

async function attachOrphanSuggestions(
  creatorId: string,
  postId: mongoose.Types.ObjectId
): Promise<void> {
  try {
    await ExcerptSuggestion.updateMany(
      {
        creator: creatorId,
        post: null,
        createdAt: { $gte: new Date(Date.now() - ORPHAN_CLAIM_WINDOW_MS) },
      },
      { $set: { post: postId } }
    );
  } catch (error) {
    console.error('Failed to attach orphan excerpt suggestions:', error);
  }
}

export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = postSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
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
    await attachOrphanSuggestions(req.user!.id, post._id as mongoose.Types.ObjectId);
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = updatePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (req.user!.role !== 'admin' && String(post.owner) !== req.user!.id) {
      res
        .status(403)
        .json({ error: 'You do not have permission to edit this post' });
      return;
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
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// A provider that hangs must not hang the Creator's editor with it. 8s is
// generous for a text summary call but bounds the worst case to "annoying"
// rather than "stuck forever". Overridable so tests can exercise the timeout
// path without actually waiting 8s.
const SUGGESTION_TIMEOUT_MS = Number(process.env.AI_SUGGESTION_TIMEOUT_MS) || 8_000;

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

// Records that a suggestion was issued so the adoption and kept-unedited
// thresholds (docs/excerpt-suggestion-metrics.md) can later be answered.
// Never lets a write failure surface to the Creator — a lost measurement is
// cheaper than a broken button.
async function recordExcerptSuggestion(params: {
  creatorId: string;
  postId?: string;
  text: string;
  source: 'provider' | 'fallback';
}): Promise<void> {
  try {
    await ExcerptSuggestion.create({
      creator: params.creatorId,
      post: params.postId,
      text: params.text,
      source: params.source,
    });
  } catch (error) {
    console.error('Failed to record excerpt suggestion:', error);
  }
}

export const suggestPostExcerpt = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const validation = suggestExcerptSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
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
    console.error('Suggest excerpt error, falling back to derived excerpt:', error);
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
  try {
    await Post.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });
    res.status(204).end();
  } catch {
    res.status(400).json({ error: 'Invalid id' });
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (req.user!.role !== 'admin' && String(post.owner) !== req.user!.id) {
      res
        .status(403)
        .json({ error: 'You do not have permission to delete this post' });
      return;
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
