import { Router } from 'express';
import {
  getPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  incrementViews,
} from '../controllers/posts.controller';
import { auth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getPosts);
router.get('/slug/:slug', getPostBySlug);
router.get('/:id', optionalAuth, getPost);
router.post('/:id/view', incrementViews);
// Body validation happens in the controllers via safeParse (their {field,message}
// error shape is what the frontend consumes), so no validateBody middleware here.
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

export default router;
