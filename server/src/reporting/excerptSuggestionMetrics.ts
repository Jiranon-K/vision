import Post from '../models/Post';
import ExcerptSuggestion from '../models/ExcerptSuggestion';

// The two thresholds fixed before this capability was built (see
// docs/excerpt-suggestion-metrics.md for what to do when either is missed).
export const ADOPTION_THRESHOLD = 0.25;
export const KEPT_UNEDITED_THRESHOLD = 0.4;

export interface AdoptionResult {
  publishedPosts: number;
  postsWithSuggestion: number;
  // null when no Posts were published in the window — a rate would be
  // meaningless, not zero.
  adoptionRate: number | null;
}

// Share of Posts published in the window for which at least one Excerpt
// Suggestion was issued (whenever it was asked for, not just within the
// window — a Creator may draft for a while before publishing).
export async function computeAdoption(
  windowDays: number,
  now: Date = new Date()
): Promise<AdoptionResult> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const published = await Post.find({
    status: 'Published',
    createdAt: { $gte: since, $lte: now },
  })
    .select('_id')
    .lean();
  const postIds = published.map((p) => p._id);

  const postsWithSuggestion = postIds.length
    ? (await ExcerptSuggestion.distinct('post', { post: { $in: postIds } })).length
    : 0;

  return {
    publishedPosts: postIds.length,
    postsWithSuggestion,
    adoptionRate: postIds.length ? postsWithSuggestion / postIds.length : null,
  };
}

export interface KeptUneditedResult {
  issuedSuggestions: number;
  keptUnedited: number;
  keptUneditedRate: number | null;
}

// Share of suggestions issued in the window (that reached a saved Post) whose
// text matches that Post's current Excerpt exactly.
export async function computeKeptUnedited(
  windowDays: number,
  now: Date = new Date()
): Promise<KeptUneditedResult> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const suggestions = await ExcerptSuggestion.find({
    post: { $ne: null },
    createdAt: { $gte: since, $lte: now },
  })
    .select('post text')
    .lean();

  if (!suggestions.length) {
    return { issuedSuggestions: 0, keptUnedited: 0, keptUneditedRate: null };
  }

  const postIds = [...new Set(suggestions.map((s) => String(s.post)))];
  const posts = await Post.find({ _id: { $in: postIds } })
    .select('excerpt')
    .lean();
  const excerptById = new Map(posts.map((p) => [String(p._id), p.excerpt]));

  const keptUnedited = suggestions.filter(
    (s) => excerptById.get(String(s.post)) === s.text
  ).length;

  return {
    issuedSuggestions: suggestions.length,
    keptUnedited,
    keptUneditedRate: keptUnedited / suggestions.length,
  };
}

export function formatRate(rate: number | null): string {
  return rate === null ? 'n/a' : `${(rate * 100).toFixed(1)}%`;
}
