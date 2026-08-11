import { Router } from 'express';
import {
  getPosts,
  getPublicPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  incrementViews,
  suggestPostExcerpt,
} from '../controllers/posts.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { suggestExcerptLimiter } from '../config/rateLimit';

const router = Router();

// Two audiences, two paths. "/" answers "what does this Creator own"; "/public"
// answers "what may a Reader read". Sharing one path and branching on whether a
// session was present is what leaked every Creator's Drafts to every Creator.
router.get('/', auth, getPosts);
router.get('/public', getPublicPosts);
router.get('/slug/:slug', getPostBySlug);
// Above /:id so "suggest-excerpt" is never read as a Post id.
router.post('/suggest-excerpt', auth, suggestExcerptLimiter, suggestPostExcerpt);
router.get('/:id', optionalAuth, getPost);
router.post('/:id/view', incrementViews);
// Body validation happens in the controllers via safeParse (their {field,message}
// error shape is what the frontend consumes), so no validateBody middleware here.
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

export default router;
