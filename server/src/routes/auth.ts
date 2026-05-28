import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller';
import { auth } from '../middleware/auth';
import { loginLimiter, registerLimiter, forgotPasswordLimiter, resendVerificationLimiter } from '../config/rateLimit';

const router = Router();


router.post('/register', registerLimiter, register);


router.post('/login', loginLimiter, login);


router.post('/logout', logout);


router.post('/refresh', refresh);


router.get('/me', auth, getMe);


router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);


router.post('/reset-password', resetPassword);


router.post('/verify-email', verifyEmail);

router.post('/resend-verification', auth, resendVerificationLimiter, resendVerification);

export default router;
