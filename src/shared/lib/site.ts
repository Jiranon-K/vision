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

export const SITE_TAGLINE = "Write once, keep your Readers";

export const SITE_DESCRIPTION =
  "Vision is where Creators write, publish, and keep their Readers. " +
  "Readers follow a Creator by email, every new Post can reach their " +
  "inbox, and the Creator can export the list whenever they like.";

export const SITE_KEYWORDS = [
  "blog platform",
  "content creator",
  "email followers",
  "own your audience",
  "publishing tool",
  "audience growth",
  "SEO blogging",
];
