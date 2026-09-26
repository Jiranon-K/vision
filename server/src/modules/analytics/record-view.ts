import type { Request } from 'express';
import type { Types } from 'mongoose';
import { isDuplicateKeyError } from '../../platform/duplicate-key';
import PostView, { startOfUtcDay } from './post-view.model';
import ViewRecord from './view-record.model';
import {
  VIEW_DEDUPE_WINDOW_HOURS,
  deriveReader,
  looksLikeCrawler,
} from './reader-identity';

interface ViewedPost {
  _id: Types.ObjectId;
  owner?: unknown;
}

// Records that a Reader read a Post the caller has already confirmed is
// readable. Returns whether it counted as a new View, so the caller can move
// the Post's own total.
/** Where a View came from, when the Reader arrived by a link that says. */
export type ViewSource = 'delivery';

export async function recordView(
  post: ViewedPost,
  req: Request,
  now = new Date(),
  source?: ViewSource
): Promise<boolean> {
  // Indexing is not readership. Answered as success so a crawler learns
  // nothing from the difference.
  if (looksLikeCrawler(req)) return false;

  const reader = deriveReader(req, now);
  const expiresAt = new Date(
    now.getTime() + VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000
  );

  try {
    await ViewRecord.create({ post: post._id, reader, expiresAt });
  } catch (error) {
    // The unique index rejecting the row is the deduplication: this Reader has
    // already been counted for this Post inside the window. Accepted and
    // ignored rather than refused, so the client needs no logic to interpret it.
    if (isDuplicateKeyError(error)) return false;
    throw error;
  }

  // The Post's counter answers "how many"; the daily rollup answers "when",
  // which is what the Creator's weekly trend is made of.
  await PostView.updateOne(
    { post: post._id, day: startOfUtcDay(now) },
    {
      $inc: { count: 1, fromDelivery: source === 'delivery' ? 1 : 0 },
      $setOnInsert: { owner: post.owner },
    },
    { upsert: true }
  );
  return true;
}

// Totals describe Posts that exist, so the rollup goes with the Post.
export async function forgetViews(postId: Types.ObjectId): Promise<void> {
  await PostView.deleteMany({ post: postId });
  await ViewRecord.deleteMany({ post: postId });
}
