// Fall back to the local backend rather than "" — an empty base produces a
// relative URL, which server-side fetch (RSC/sitemap/build) rejects.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: "Published" | "Draft";
  author: {
    name: string;
    role: string;
  };
  date: string;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface RawPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: Post["status"];
  author: { name: string; role: string };
  date: string;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

function normalize(raw: RawPost): Post {
  const { _id, ...rest } = raw;
  return { id: _id, ...rest };
}

// Server-side public fetch — no credentials, ISR-cached.
export async function getPublishedPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts?status=Published`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  const data = await res.json();
  const arr: RawPost[] = Array.isArray(data) ? data : [];
  return arr.map(normalize);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/posts/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 300 } },
  );

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status}`);
  }

  const data: RawPost = await res.json();
  return normalize(data);
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
