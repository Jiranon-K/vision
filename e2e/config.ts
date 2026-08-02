// The E2E environment is composed explicitly and never inherited from the
// developer's shell. Inheriting would let a real RESEND_API_KEY reach the test
// run, and every registration in the suite would send a real email.
export const E2E_WEB_PORT = 3100;
export const E2E_API_PORT = 3101;

export const WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
export const API_URL = `http://localhost:${E2E_API_PORT}`;

// Must end in `_e2e` — global-setup refuses to wipe anything else.
export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI || 'mongodb://localhost:27017/vision_e2e';

export const CREATOR = {
  email: 'creator@e2e.local',
  password: 'E2ePass1!',
  name: 'E2E Creator',
};

export const STORAGE_STATE = 'e2e/.auth/creator.json';

export const SEEDED_PUBLISHED_POST = {
  title: 'Seeded Published Post',
  content:
    'This post is seeded by the E2E setup project so the public blog has something to render.',
  category: 'SEO',
  status: 'Published' as const,
};

export const SEEDED_DRAFT_POST = {
  title: 'Seeded Draft Post',
  content: 'This draft must never be visible to an anonymous reader.',
  category: 'Content',
  status: 'Draft' as const,
};

// Mirrors generateUniqueSlug in server/src/controllers/posts.controller.ts.
// Only valid for titles that are unique across the run — which every title
// this suite creates is.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
}

export const serverEnv: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: String(E2E_API_PORT),
  MONGODB_URI: E2E_MONGODB_URI,
  JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
  FRONTEND_URL: WEB_URL,
  // Deliberately fake. server/src/emails/client.ts builds a Resend client
  // straight from this value and has no stub path.
  RESEND_API_KEY: 're_e2e_fake_key',
  EMAIL_FROM: 'noreply@e2e.local',
  EMAIL_FROM_NAME: 'Vision E2E',
  ADMIN_EMAILS: '',
};

export const webEnv: Record<string, string> = {
  NEXT_PUBLIC_API_URL: API_URL,
  NEXT_PUBLIC_SITE_URL: WEB_URL,
  // Keeps the E2E run off the developer's `.next` lock (see next.config.ts).
  NEXT_DIST_DIR: '.next-e2e',
};
