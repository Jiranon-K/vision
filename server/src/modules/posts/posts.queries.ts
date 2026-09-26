import mongoose from 'mongoose';
import Post from './post.model';

// What other modules may know about Posts without reaching the model. Apart
// from posts.service.ts on purpose: the service needs the auth and
// excerpt-suggestion modules, and excerpt-suggestion reads these, so keeping
// them here keeps that import one-way and free of the session module's secrets.

/** A Creator's totals: Views across their Published Posts, and how many Posts they own. */
export async function creatorTotals(
  creatorId: string
): Promise<{ views: number; posts: number }> {
  const owner = new mongoose.Types.ObjectId(creatorId);
  const [viewAgg, posts] = await Promise.all([
    Post.aggregate<{ total: number }>([
      { $match: { owner, status: 'Published' } },
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]),
    Post.countDocuments({ owner }),
  ]);
  return { views: viewAgg[0]?.total ?? 0, posts };
}

/** The ids of Posts created Published inside the window, both ends included. */
export async function publishedPostIds(
  since: Date,
  until: Date
): Promise<mongoose.Types.ObjectId[]> {
  const published = await Post.find({
    status: 'Published',
    createdAt: { $gte: since, $lte: until },
  })
    .select('_id')
    .lean();
  return published.map((p) => p._id as mongoose.Types.ObjectId);
}

/** The current Excerpt of each of these Posts that still exists, by id. */
export async function currentExcerpts(
  postIds: string[]
): Promise<Map<string, string>> {
  const posts = await Post.find({ _id: { $in: postIds } })
    .select('excerpt')
    .lean();
  return new Map(posts.map((p) => [String(p._id), p.excerpt]));
}
