import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getNotifications,
  updateNotifications,
} from '../controllers/settings.controller';
import { auth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { profileSchema, notificationSchema, changePasswordSchema } from '../schemas/auth';

const router = Router();

router.use(auth);

router.get('/profile', getProfile);
router.put('/profile', validateBody(profileSchema), updateProfile);
router.put('/password', validateBody(changePasswordSchema), changePassword);
router.get('/notifications', getNotifications);
router.put('/notifications', validateBody(notificationSchema), updateNotifications);

export default router;
