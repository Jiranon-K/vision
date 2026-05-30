import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import { postSchema, updatePostSchema } from '../schemas/posts';
import { computeReadTime, deriveExcerpt } from '../utils/postContent';

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

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
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
