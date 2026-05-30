const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tag: string;
  status: "Published" | "Draft" | "Scheduled";
  author: {
    name: string;
    role: string;
  };
  date: string;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface RawPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tag: string;
  status: Post["status"];
  author: { name: string; role: string };
  date: string;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
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
