import type { DashboardPost, PostRow } from "./types";

// The single place that knows what the API returns for a Post. Before this
// module the wire shape was declared in three files and the `_id` -> `id`
// mapping written three times, so a field rename on the server broke two of
// them silently — TypeScript had no way to know the three were meant to agree.

export type PostStatus = "Published" | "Draft";

export type PostPermission = "edit" | "publish" | "delete" | "withhold" | "restore";

export function allows(
  post: { permissions?: readonly PostPermission[] } | null | undefined,
  action: PostPermission,
): boolean {
  return post?.permissions?.includes(action) ?? false;
}

export interface PostCreator {
  name: string;
  byline?: string;
}

/**
 * What a listing endpoint returns per Post. Listing and reading are different
 * requests with different payloads: content is the bulk of a Post and no
 * listing displays it.
 */
export interface WirePostSummary {
  _id: string;
  title: string;
  excerpt: string;
  category: string;
  status: PostStatus;
  date: string | number | Date;
  readTime: string;
  views: number;
  featured: boolean;
  slug: string;
  author: PostCreator;
  createdAt: string;
  updatedAt: string;
  /** Present only on the Hub listing. */
  owner?: string;
  withheld?: boolean;
  permissions?: PostPermission[];
  /** Present once the Post has been delivered to its Creator's Followers. */
  delivery?: PostDelivery;
}

/** A Post's one Delivery (CONTEXT.md): when, and to how many Followers. */
export interface PostDelivery {
  followers: number;
  at: string;
}

/** What the single-post endpoints return: the full document. */
export interface WirePost extends WirePostSummary {
  content: string;
  coverImage?: string;
}

/** One page of a listing, plus how to ask for the next. */
export interface WirePage<T> {
  items: T[];
  nextCursor?: string;
}

/** A Post as a listing shows it. */
export interface PostSummary {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: PostStatus;
  author: PostCreator;
  date: string;
  readTime: string;
  featured: boolean;
  views: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
  withheld: boolean;
  permissions: PostPermission[];
  delivery?: PostDelivery;
}

/** A Post as the app uses it when it has been read in full. */
export interface Post extends PostSummary {
  content: string;
  coverImage?: string;
}

export function formatPostDate(date: string | number | Date): string {
  const parsed = new Date(date);
  // The wire always carries an ISO string, so this must parse rather than pass
  // strings through — doing that shipped raw timestamps onto every Post card.
  // Anything unparseable is returned as-is instead of rendering "Invalid Date".
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normaliseAccess(wire: WirePostSummary) {
  return {
    withheld: wire.withheld === true,
    permissions: Array.isArray(wire.permissions) ? wire.permissions : [],
  };
}

export function toPost(wire: WirePost): Post {
  const { _id, date, ...rest } = wire;
  return { ...rest, ...normaliseAccess(wire), id: _id, date: formatPostDate(date) };
}

export function toPostSummary(wire: WirePostSummary): PostSummary {
  const { _id, date, ...rest } = wire;
  return { ...rest, ...normaliseAccess(wire), id: _id, date: formatPostDate(date) };
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
    delivery: wire.delivery,
    ...normaliseAccess(wire),
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

/** Endpoints that return a page can return anything on error; this narrows it. */
export function asWirePage<T extends WirePostSummary>(
  payload: unknown
): WirePage<T> {
  const page = payload as WirePage<T> | undefined;
  return Array.isArray(page?.items)
    ? { items: page.items, nextCursor: page.nextCursor }
    : { items: [] };
}
