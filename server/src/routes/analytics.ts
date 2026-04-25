import { Router } from 'express';
import { getStats, getViewsData } from '../controllers/analytics.controller';

const router = Router();

router.get('/', getStats);
router.get('/views', getViewsData);

export default router;
