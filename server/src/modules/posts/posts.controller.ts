import { Request, Response } from 'express';
import type { AuthRequest } from '../auth';
import * as posts from './posts.service';

// HTTP only: read the request, call the service, write the response. The rules
// — who may do what, Slugs, derived fields, list scope — live in posts.service.ts.

export const getPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json(await posts.listPosts(req.actor!, req.query));
};

export const getPublicPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.json(await posts.listPublishedPosts(req.query));
};

export const getPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json(await posts.getPost(req.actor!, String(req.params.id)));
};

export const getPostBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  const found = await posts.getPublishedBySlug(String(req.params.slug));
  if ('post' in found) {
    res.json(found.post);
    return;
  }

  // A permanent redirect rather than a failure, so search engines learn the
  // new address.
  res
    .status(301)
    .location(`/api/posts/slug/${encodeURIComponent(found.movedTo)}`)
    .json({ slug: found.movedTo });
};

export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res
    .status(201)
    .json(await posts.createPost(req.actor!, req.body, req.user?.name));
};

export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json(
    await posts.updatePost(req.actor!, String(req.params.id), req.body)
  );
};

export const suggestPostExcerpt = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const suggestion = await posts.suggestPostExcerpt(req.actor!, req.body);
  if (!suggestion) {
    res.status(503).json({ error: 'Excerpt suggestions are not available' });
    return;
  }
  res.json(suggestion);
};

export const incrementViews = async (
  req: Request,
  res: Response
): Promise<void> => {
  await posts.viewPost(String(req.params.id), req);
  res.status(204).end();
};

export const withholdPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json(
    await posts.withholdPost(req.actor!, String(req.params.id), req.body)
  );
};

export const restorePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json(await posts.restorePost(req.actor!, String(req.params.id)));
};

export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  await posts.deletePost(req.actor!, String(req.params.id));
  res.json({ message: 'Post deleted successfully' });
};
