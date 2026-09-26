import { Router } from 'express';
import { getStats, getViewsData, getFollowerFigures } from './analytics.controller';
import { auth } from '../auth';

const router = Router();

// No optional-session behaviour here: there is no useful anonymous reading of a
// Creator's Audience size, and an optional session is what turned the Posts
// list into a cross-Creator leak.
router.get('/', auth, getStats);
router.get('/views', auth, getViewsData);
router.get('/followers', auth, getFollowerFigures);

export default router;
