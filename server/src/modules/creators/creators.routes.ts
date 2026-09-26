import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getNotifications,
  updateNotifications,
} from './creators.controller';
import { auth } from '../auth';
import { validateBody } from '../../platform/middleware/validate';
import { profileSchema, notificationSchema, changePasswordSchema } from './creators.schema';

const router = Router();

router.use(auth);

router.get('/profile', getProfile);
router.put('/profile', validateBody(profileSchema), updateProfile);
router.put('/password', validateBody(changePasswordSchema), changePassword);
router.get('/notifications', getNotifications);
router.put('/notifications', validateBody(notificationSchema), updateNotifications);

export default router;
