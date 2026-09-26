// The Posts feature's interface (ADR 0007): the Post wire contract, the Hub's
// Posts list, and the Category set. Anything not exported here is internal.
export {
  allows,
  asWirePage,
  formatPostDate,
  toDashboardPost,
  toPost,
  toPostRow,
  toPostSummary,
  type Post,
  type PostCreator,
  type PostPermission,
  type PostStatus,
  type PostSummary,
  type WirePage,
  type WirePost,
  type WirePostSummary,
} from "./contract";
export type { DashboardPost, PostRow } from "./types";
export { categories, statusFilters } from "./categories";
export { computeReadTime, countWords } from "./reading-time";
export { invalidatePostData, useInvalidatePostData, usePosts } from "./hooks/use-posts";
export { default as FilterBar } from "./components/filter-bar";
export { default as PostsHeader } from "./components/posts-header";
export { default as PostsTable } from "./components/posts-table";
