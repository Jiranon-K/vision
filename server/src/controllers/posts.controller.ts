import { Request, Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import { postSchema, updatePostSchema } from '../schemas/posts';

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

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
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

    const { title, excerpt, content, category, tag, status, readTime, featured } =
      validation.data;

    const slug = await generateUniqueSlug(title);

    const post = new Post({
      title,
      excerpt,
      content,
      category,
      tag,
      status,
      readTime,
      featured: featured || false,
      slug,
      author: {
        name: req.user?.name || 'Unknown Author',
        role: 'Author',
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

    const update: Record<string, unknown> = { ...validation.data };

    if (validation.data.title) {
      update.slug = await generateUniqueSlug(
        validation.data.title,
        String(req.params.id)
      );
    }

    const post = await Post.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
