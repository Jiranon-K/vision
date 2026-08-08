import {
  asWireList,
  toPost,
  type Post,
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

// Server-side public fetch — no credentials, ISR-cached.
export async function getPublishedPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts?status=Published`, {
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  return asWireList<WirePost>(await res.json()).map(toPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/posts/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: REVALIDATE } },
  );

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
