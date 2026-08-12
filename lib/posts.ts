import {
  asWirePage,
  toPost,
  toPostSummary,
  type Post,
  type PostSummary,
  type WirePost,
} from "@/lib/post-contract";

// Fall back to the local backend rather than "" — an empty base produces a
// relative URL, which server-side fetch (RSC/sitemap/build) rejects.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// A five-minute ISR window outlives an E2E run: the server is warmed before the
// database is seeded, so every page would render the empty listing that request
// cached. `POSTS_REVALIDATE=0` opts that run out of the cache entirely.
const REVALIDATE = Number(process.env.POSTS_REVALIDATE ?? 300);

// A traversal has to terminate on its own even if the server keeps offering a
// cursor. 200 pages is far past any real archive and short of a hang.
const MAX_PAGES = 200;

// Server-side public fetch — no credentials, ISR-cached. The blog filters by
// Category in the browser, so it needs the whole archive; what changed is that
// each request is now bounded and none of them carries a Post's body.
export async function getPublishedPosts(): Promise<PostSummary[]> {
  const posts: PostSummary[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${API_BASE_URL}/api/posts/public`);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.status}`);
    }

    const { items, nextCursor } = asWirePage(await res.json());
    posts.push(...items.map(toPostSummary));
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return posts;
}

/** A Post read at an address it no longer answers at. */
export interface MovedPost {
  movedTo: string;
}

export function isMovedPost(value: Post | MovedPost | null): value is MovedPost {
  return value !== null && "movedTo" in value;
}

export async function getPostBySlug(
  slug: string,
): Promise<Post | MovedPost | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/posts/slug/${encodeURIComponent(slug)}`,
    // manual: a retained Slug answers 301, and following it here would serve
    // the Post at the old address — the Reader's URL and the search engine's
    // index both need to learn the new one.
    { next: { revalidate: REVALIDATE }, redirect: "manual" },
  );

  if (res.status === 301) {
    const { slug: movedTo } = (await res.json()) as { slug: string };
    return { movedTo };
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status}`);
  }

  return toPost((await res.json()) as WirePost);
}

// Fire-and-forget view counter (client-side beacon). Swallows all errors —
// a failed view ping must never surface to the reader.
export async function incrementPostViews(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/posts/${encodeURIComponent(id)}/view`, {
      method: "POST",
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
