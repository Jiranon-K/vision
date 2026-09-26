import express from 'express';
import { auth } from '../auth';
import { followLimiter, followAddressLimiter } from '../../platform/rate-limit';
import * as controller from './followers.controller';

const router = express.Router();

// A Reader, without an account.
router.post('/', followLimiter, followAddressLimiter, controller.follow);
router.post('/confirm', controller.confirm);
router.post('/stop', controller.stop);
router.post('/stop/:token', controller.stop);

// The Creator the Followers belong to.
router.get('/', auth, controller.list);
router.get('/export', auth, controller.exportCsv);
router.get('/summary', auth, controller.summary);
router.get('/count/:creatorId', auth, controller.count);

export default router;
