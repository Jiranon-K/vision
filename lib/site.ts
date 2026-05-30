const DEFAULT_SITE_URL = "http://localhost:3000";

// Normalize NEXT_PUBLIC_SITE_URL into a valid absolute origin. A bare host
// (e.g. "my-site.com") gets an https:// prefix; anything unparseable falls
// back to the default so `new URL(SITE_URL)` in metadata never throws at
// module load.
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Vision";

export const SITE_TAGLINE = "Write once, share everywhere";

export const SITE_DESCRIPTION =
  "Vision is the infrastructure for modern creators. Write your story, " +
  "broadcast it to every social platform in one click, and grow your " +
  "audience with built-in discovery and analytics.";

export const SITE_KEYWORDS = [
  "blog platform",
  "content creator",
  "social media broadcasting",
  "cross-posting",
  "publishing tool",
  "audience growth",
  "SEO blogging",
];
