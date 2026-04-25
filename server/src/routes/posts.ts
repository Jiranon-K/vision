import { Router } from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/posts.controller';
import { auth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { postSchema, updatePostSchema } from '../schemas/posts';

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', auth, validateBody(postSchema), createPost);
router.put('/:id', auth, validateBody(updatePostSchema), updatePost);
router.delete('/:id', auth, deletePost);

export default router;
