import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, type Actor } from '../auth';
import { readablePostForFollowing } from '../posts';
import { gone, notFound, validationFailed } from '../../platform/errors';
import { logger } from '../../platform/logger';
import { FRONTEND_URL } from '../../platform/emails/client';
import { sendFollowConfirmationEmail } from '../../platform/emails/send';
import Follower from './follower.model';
import Delivery from './delivery.model';
import DeliverySend from './delivery-send.model';
import { followSchema, tokenSchema } from './followers.schema';
import { sendableToday } from './sending';

// The rules of Followers, with no HTTP in them (ADR 0009): a Reader follows a
// Creator by email and confirms it; the Creator sees, exports and delivers to
// their Followers; nobody else sees who they are.

const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const newToken = (): string => crypto.randomBytes(32).toString('hex');
const hash = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const confirmedOf = (creatorId: string | mongoose.Types.ObjectId) => ({
  creator: new mongoose.Types.ObjectId(String(creatorId)),
  state: 'confirmed' as const,
});

// Only a signed-in person asks about Followers, and only about their own.
function ownerId(actor: Actor): string {
  if (actor.kind === 'reader') throw notFound('Not found');
  return actor.id;
}

async function creatorProfile(creatorId: string | mongoose.Types.ObjectId) {
  const user = await User.findById(creatorId).select('email profile.name profile.byline');
  return {
    name: user?.profile?.name || 'A Creator',
    byline: user?.profile?.byline || undefined,
    email: user?.email,
  };
}

/**
 * A Reader asks to follow the Creator of a Post. The answer never says whether
 * the address already follows them: the form must not be a way to learn who
 * follows whom. A confirmed address is sent nothing.
 */
export async function follow(input: unknown): Promise<void> {
  const validation = followSchema.safeParse(input);
  if (!validation.success) throw validationFailed(validation.error.issues);
  const { postId, email } = validation.data;

  const post = await readablePostForFollowing(postId);
  if (!post) throw notFound('Post not found');

  const existing = await Follower.findOne({ creator: post.owner, email }).select('state');
  if (existing?.state === 'confirmed') return;

  const token = newToken();
  const pending = {
    confirmTokenHash: hash(token),
    confirmExpiresAt: new Date(Date.now() + CONFIRM_TTL_MS),
    source: { slug: post.slug, title: post.title },
  };

  try {
    await Follower.updateOne(
      { creator: post.owner, email, state: 'pending' },
      { $set: pending, $setOnInsert: { stopToken: newToken() } },
      { upsert: true }
    );
  } catch (error) {
    // Two submissions racing, or one that raced a confirmation: either way the
    // address is already held, and the answer is the same.
    if ((error as { code?: number }).code === 11000) return;
    throw error;
  }

  try {
    await sendFollowConfirmationEmail({
      to: email,
      creatorName: post.author.name,
      confirmUrl: `${FRONTEND_URL}/follow/confirm?token=${token}`,
    });
  } catch (error) {
    // The Reader can submit again for a fresh link; failing the request would
    // tell them nothing they can act on.
    logger.error({ err: error }, 'Follow confirmation email failed');
  }
}

export interface FollowOutcome {
  creator: { name: string; byline?: string };
  post: { slug: string; title: string };
}

export async function confirm(input: unknown): Promise<FollowOutcome> {
  const validation = tokenSchema.safeParse(input);
  if (!validation.success) throw gone('This link has already been used or expired');

  const follower = await Follower.findOneAndUpdate(
    {
      confirmTokenHash: hash(validation.data.token),
      state: 'pending',
      confirmExpiresAt: { $gt: new Date() },
    },
    {
      $set: { state: 'confirmed', confirmedAt: new Date() },
      $unset: { confirmTokenHash: '', confirmExpiresAt: '' },
    },
    { new: true }
  );
  if (!follower) throw gone('This link has already been used or expired');

  const { name, byline } = await creatorProfile(follower.creator);
  return { creator: { name, byline }, post: follower.source };
}

/**
 * Stops a Follower, from a link in any Delivery. Nothing already waiting to be
 * sent to them goes out afterwards. Stopping twice is not an error.
 */
export async function stop(token: string): Promise<FollowOutcome | undefined> {
  const follower = await Follower.findOneAndDelete({ stopToken: token });
  if (!follower) return undefined;
  await DeliverySend.deleteMany({ follower: follower._id, state: { $in: ['pending', 'sending'] } });
  const { name, byline } = await creatorProfile(follower.creator);
  return { creator: { name, byline }, post: follower.source };
}

export interface FollowerRow {
  email: string;
  since: Date;
}

const LIST_CAP = 5000;

export async function listFollowers(actor: Actor): Promise<FollowerRow[]> {
  const rows = await Follower.find(confirmedOf(ownerId(actor)))
    .select('email confirmedAt')
    .sort({ confirmedAt: -1 })
    .limit(LIST_CAP)
    .lean();
  return rows.map((r) => ({ email: r.email, since: r.confirmedAt! }));
}

// A spreadsheet treats a cell starting with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;
const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function exportFollowers(actor: Actor): Promise<string> {
  const rows = await listFollowers(actor);
  const lines = rows.map(
    (r) => `${csvCell(r.email)},${r.since.toISOString().slice(0, 10)}`
  );
  return ['email,following_since', ...lines].join('\n') + '\n';
}

export async function followerCount(creatorId: string): Promise<number> {
  return Follower.countDocuments(confirmedOf(creatorId));
}

/** How many Followers a Creator has. Only that Creator and an Admin may ask. */
export async function countFor(actor: Actor, creatorId: string): Promise<number> {
  if (!mongoose.isValidObjectId(creatorId)) throw notFound('Not found');
  if (actor.kind === 'reader') throw notFound('Not found');
  if (actor.kind === 'creator' && actor.id !== creatorId) throw notFound('Not found');
  return followerCount(creatorId);
}

export interface FollowerSummary {
  followers: number;
  weeklyGain: number;
  /** How many Delivery emails the platform can still send today. */
  sendableToday: number;
}

export async function summary(actor: Actor, now = new Date()): Promise<FollowerSummary> {
  const id = ownerId(actor);
  const [followers, weeklyGain, left] = await Promise.all([
    followerCount(id),
    Follower.countDocuments({
      ...confirmedOf(id),
      confirmedAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) },
    }),
    sendableToday(now),
  ]);
  return { followers, weeklyGain, sendableToday: left };
}

export interface DeliverRequest {
  postId: mongoose.Types.ObjectId;
  creatorId: string;
  title: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  slug: string;
  creatorName: string;
  byline?: string;
}

/**
 * Delivers a Post that has just been published to every current Follower of
 * its Creator. Queues the emails and returns; the sending happens elsewhere,
 * so publishing never waits on an email provider. Returns undefined when there
 * was nothing to deliver: no Followers, or the Post was delivered before.
 */
export async function deliverPost(
  request: DeliverRequest,
  now = new Date()
): Promise<{ followers: number; at: Date } | undefined> {
  const followers = await Follower.find(confirmedOf(request.creatorId)).select('_id').lean();
  if (followers.length === 0) return undefined;

  const { email: replyTo } = await creatorProfile(request.creatorId);
  let delivery;
  try {
    delivery = await Delivery.create({
      post: request.postId,
      creator: request.creatorId,
      followers: followers.length,
      email: {
        creatorName: request.creatorName,
        byline: request.byline,
        replyTo,
        title: request.title,
        excerpt: request.excerpt,
        readTime: request.readTime,
        coverImage: request.coverImage,
        slug: request.slug,
      },
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return undefined;
    throw error;
  }

  await DeliverySend.insertMany(
    followers.map((f) => ({ delivery: delivery._id, follower: f._id, nextAttemptAt: now })),
    { ordered: false }
  );
  return { followers: followers.length, at: delivery.createdAt };
}

/** Whether, when, and to how many Followers a Post was delivered. */
export async function deliveryOf(
  postId: mongoose.Types.ObjectId | string
): Promise<{ followers: number; at: Date } | undefined> {
  const found = await Delivery.findOne({ post: postId }).select('followers createdAt').lean();
  return found ? { followers: found.followers, at: found.createdAt } : undefined;
}

export interface DeliveryFigures {
  followers: number;
  weeklyGain: number;
  /** Follower emails queued by Deliveries in the window. */
  delivered: number;
  deliveries: number;
  lastDeliveryAt?: Date;
}

/** Growth Analytics' view of a Creator's Followers over the last seven days. */
export async function deliveryFigures(creatorId: string, now = new Date()): Promise<DeliveryFigures> {
  const since = new Date(now.getTime() - 7 * DAY_MS);
  const creator = new mongoose.Types.ObjectId(creatorId);
  const [followers, weeklyGain, recent, last] = await Promise.all([
    followerCount(creatorId),
    Follower.countDocuments({ ...confirmedOf(creatorId), confirmedAt: { $gte: since } }),
    Delivery.aggregate<{ delivered: number; deliveries: number }>([
      { $match: { creator, createdAt: { $gte: since } } },
      { $group: { _id: null, delivered: { $sum: '$followers' }, deliveries: { $sum: 1 } } },
    ]),
    Delivery.findOne({ creator }).sort({ createdAt: -1 }).select('createdAt').lean(),
  ]);
  return {
    followers,
    weeklyGain,
    delivered: recent[0]?.delivered ?? 0,
    deliveries: recent[0]?.deliveries ?? 0,
    lastDeliveryAt: last?.createdAt,
  };
}
