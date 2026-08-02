import type { DashboardPost, PostRow } from "@/types/types";

// The single place that knows what the API returns for a Post. Before this
// module the wire shape was declared in three files and the `_id` -> `id`
// mapping written three times, so a field rename on the server broke two of
// them silently — TypeScript had no way to know the three were meant to agree.

export type PostStatus = "Published" | "Draft";

/** Fields every posts endpoint returns. */
export interface WirePostSummary {
  _id: string;
  title: string;
  category: string;
  status: PostStatus;
  date: string | number | Date;
  readTime: string;
  views: number;
  /** Present only on authenticated reads. */
  owner?: string;
}

/** What the single-post and public-list endpoints return: the full document. */
export interface WirePost extends WirePostSummary {
  excerpt: string;
  content: string;
  author: { name: string; role: string };
  featured: boolean;
  slug: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

/** A Post as the app uses it. */
export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: PostStatus;
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

export function formatPostDate(date: string | number | Date): string {
  if (typeof date === "string") return date;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toPost(wire: WirePost): Post {
  const { _id, date, ...rest } = wire;
  return { ...rest, id: _id, date: formatPostDate(date) };
}

export function toPostRow(wire: WirePostSummary): PostRow {
  return {
    id: wire._id,
    title: wire.title,
    category: wire.category,
    status: wire.status,
    date: formatPostDate(wire.date),
    views: wire.views,
    readTime: wire.readTime,
    owner: String(wire.owner ?? ""),
  };
}

export function toDashboardPost(wire: WirePostSummary): DashboardPost {
  return {
    id: wire._id,
    title: wire.title,
    category: wire.category,
    status: wire.status,
    date: formatPostDate(wire.date),
    views: wire.views,
  };
}

/** Endpoints that return a list can return anything on error; this narrows it. */
export function asWireList<T extends WirePostSummary>(payload: unknown): T[] {
  return Array.isArray(payload) ? (payload as T[]) : [];
}
