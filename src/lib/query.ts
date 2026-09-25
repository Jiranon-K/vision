import { authFetch } from "@/lib/api";

/**
 * The Hub's data-fetching seam. Every screen used to hold its own loading flag,
 * error string, mount effect and refresh function — similar because someone
 * copied it carefully, not because anything guaranteed it. Caching, retry,
 * deduplication, invalidation and the session-expiry response are decided here
 * once, and every hook inherits them.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Fetch through the credential-carrying client, failing loudly enough to retry on. */
export async function queryFetch<T>(path: string): Promise<T> {
  const res = await authFetch(path);
  if (!res.ok) {
    throw new ApiError(res.status, `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Transient failures are worth retrying; a refusal is not. Retrying a 403
 * repeats a decision the server has already made, and retrying a 404 waits for
 * something that is not coming.
 */
export function retryPolicy(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

/**
 * How long each kind of data stays fresh before a background revalidation.
 * Stated once so a new screen inherits a considered answer rather than
 * inventing one.
 */
export const FRESH_FOR = {
  /** A Creator edits their own Posts, so their list goes stale quickly. */
  posts: 30_000,
  /** Figures a Creator reads rather than edits tolerate more. */
  analytics: 60_000,
  /** Which optional features are configured changes at deploy time. */
  capabilities: Infinity,
} as const;

/**
 * Cache keys, in one place. A mutation invalidates by prefix, so
 * `["posts"]` covers every posts query regardless of its parameters.
 */
export const queryKeys = {
  posts: ["posts"] as const,
  postsList: () => ["posts", "list"] as const,
  postsRecent: (limit: number) => ["posts", "recent", limit] as const,
  analytics: ["analytics"] as const,
  analyticsStats: () => ["analytics", "stats"] as const,
  analyticsViews: () => ["analytics", "views"] as const,
};
