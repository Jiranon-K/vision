import { Router } from 'express';
import { getCapabilities } from '../controllers/capabilities.controller';

const router = Router();

// Unauthenticated: the editor needs this before a Creator is necessarily
// signed in, and it reveals nothing beyond which optional features are on.
router.get('/', getCapabilities);

export default router;
