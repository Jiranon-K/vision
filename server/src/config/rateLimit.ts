import rateLimit from 'express-rate-limit';
import type { Store } from 'express-rate-limit';


const createStore = (): Store | undefined => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Using in-memory rate limit store. Consider Redis for production.');
  }
  return undefined;
};


// Disable rate limiting in test environment so integration tests don't share
// in-memory counters across cases.
const skipInTest = () => process.env.NODE_ENV === 'test';


export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skip: skipInTest,
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
});


export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skip: skipInTest,
});


export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skip: (req) => req.path.startsWith('/api/health') || skipInTest(),
});


export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skip: skipInTest,
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many verification email requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  skip: skipInTest,
  keyGenerator: (req) => {
    const user = (req as { user?: { id?: string } }).user;
    return `${req.ip}-${user?.id || 'anon'}`;
  },
});
