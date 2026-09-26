import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, type Actor } from '../auth';
import { readablePostForFollowing } from '../posts';
import { gone, notFound, validationFailed } from '../../platform/errors';
import { logger } from '../../platform/logger';
import { DAY_MS, startOfUtcWeek } from '../../platform/time';
import { FRONTEND_URL } from '../../platform/emails/client';
import { sendFollowConfirmationEmail } from '../../platform/emails/send';
import Follower, { type IFollower } from './follower.model';
import Delivery, { type DeliveryContent } from './delivery.model';
import QueuedEmail from './queued-email.model';
import Departure from './departure.model';
import { authorize, ownCreatorId } from './policy';
import { followSchema, tokenSchema } from './followers.schema';
import { sendableToday } from './delivery-queue';

// The rules of Followers, with no HTTP in them (ADR 0009): a Reader follows a
// Creator by email and confirms it; the Creator sees, exports and delivers to
// their Followers; nobody else sees who they are.

const CONFIRM_TTL_MS = 2 * DAY_MS;
const LINK_SPENT = 'This link has already been used or expired';

const newToken = (): string => crypto.randomBytes(32).toString('hex');
const hash = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

const confirmedOf = (creatorId: string | mongoose.Types.ObjectId) => ({
  creator: new mongoose.Types.ObjectId(String(creatorId)),
  state: 'confirmed' as const,
});

const isDuplicate = (error: unknown) => (error as { code?: number }).code === 11000;

async function creatorProfile(creatorId: string | mongoose.Types.ObjectId) {
  const user = await User.findById(creatorId).select('email profile.name profile.byline');
  return {
    name: user?.profile?.name || 'A Creator',
    byline: user?.profile?.byline || undefined,
    email: user?.email,
  };
}

/** Whom a Reader followed or stopped following, and where they came from. */
export interface FollowOutcome {
  creator: { name: string; byline?: string };
  post: { slug: string; title: string };
}

async function outcomeOf(follower: IFollower): Promise<FollowOutcome> {
  const { name, byline } = await creatorProfile(follower.creator);
  return { creator: { name, byline }, post: follower.source };
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
  try {
    await Follower.updateOne(
      { creator: post.owner, email, state: 'pending' },
      {
        $set: {
          confirmTokenHash: hash(token),
          confirmExpiresAt: new Date(Date.now() + CONFIRM_TTL_MS),
          source: { slug: post.slug, title: post.title },
        },
        $setOnInsert: { stopToken: newToken() },
      },
      { upsert: true }
    );
  } catch (error) {
    // Two submissions racing, or one that raced a confirmation: either way the
    // address is already held, and the answer is the same.
    if (isDuplicate(error)) return;
    throw error;
  }

  try {
    await sendFollowConfirmationEmail({
      to: email,
      creatorName: post.creator.name,
      confirmUrl: `${FRONTEND_URL}/follow/confirm?token=${token}`,
    });
  } catch (error) {
    // The Reader can submit again for a fresh link; failing the request would
    // tell them nothing they can act on.
    logger.error({ err: error }, 'Follow confirmation email failed');
  }
}

export async function confirm(input: unknown): Promise<FollowOutcome> {
  const validation = tokenSchema.safeParse(input);
  if (!validation.success) throw gone(LINK_SPENT);

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
  if (!follower) throw gone(LINK_SPENT);
  return outcomeOf(follower);
}

/**
 * Stops a Follower, from the stop link in any Delivery. Nothing already
 * waiting to be sent to them goes out afterwards. Stopping twice is not an
 * error, and says nothing about whom the link belonged to.
 */
export async function stop(input: unknown): Promise<FollowOutcome | undefined> {
  const validation = tokenSchema.safeParse(input);
  if (!validation.success) return undefined;

  const follower = await Follower.findOneAndDelete({ stopToken: validation.data.token });
  if (!follower) return undefined;
  await QueuedEmail.deleteMany({ follower: follower._id, state: { $in: ['waiting', 'claimed'] } });
  // Only a confirmed Follower was ever counted, so only one leaves a trace.
  if (follower.state === 'confirmed' && follower.confirmedAt) {
    await Departure.create({
      creator: follower.creator,
      followedAt: follower.confirmedAt,
      stoppedAt: new Date(),
    });
  }
  return outcomeOf(follower);
}

export interface FollowerRow {
  email: string;
  since: Date;
}

// What a screen shows; the export has no cap, because leaving must take
// everyone (ADR 0009).
const SCREEN_CAP = 5000;

const confirmedRows = (creatorId: string) =>
  Follower.find(confirmedOf(creatorId)).select('email confirmedAt').sort({ confirmedAt: -1 }).lean();

export async function listFollowers(actor: Actor): Promise<FollowerRow[]> {
  const creatorId = ownCreatorId(actor);
  authorize(actor, 'list', creatorId);
  const rows = await confirmedRows(creatorId).limit(SCREEN_CAP);
  return rows.map((r) => ({ email: r.email, since: r.confirmedAt! }));
}

// A spreadsheet treats a cell starting with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;
const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function exportFollowers(actor: Actor): Promise<string> {
  const creatorId = ownCreatorId(actor);
  authorize(actor, 'list', creatorId);
  const lines = ['email,following_since'];
  for await (const row of confirmedRows(creatorId).cursor()) {
    lines.push(`${csvCell(row.email)},${row.confirmedAt!.toISOString().slice(0, 10)}`);
  }
  return lines.join('\n') + '\n';
}

const followerCount = (creatorId: string) => Follower.countDocuments(confirmedOf(creatorId));

const followersGainedSince = (creatorId: string, since: Date) =>
  Follower.countDocuments({ ...confirmedOf(creatorId), confirmedAt: { $gte: since } });

/** How many Followers a Creator has. Only that Creator and an Admin may ask. */
export async function countFor(actor: Actor, creatorId: string): Promise<number> {
  if (!mongoose.isValidObjectId(creatorId)) throw notFound('Not found');
  authorize(actor, 'count', creatorId);
  return followerCount(creatorId);
}

export interface FollowerSummary {
  followers: number;
  weeklyGain: number;
  /** How many Delivery emails the platform can still send today. */
  sendableToday: number;
}

export async function summary(actor: Actor, now = new Date()): Promise<FollowerSummary> {
  const creatorId = ownCreatorId(actor);
  const [followers, weeklyGain, left] = await Promise.all([
    followerCount(creatorId),
    followersGainedSince(creatorId, new Date(now.getTime() - 7 * DAY_MS)),
    sendableToday(now),
  ]);
  return { followers, weeklyGain, sendableToday: left };
}

export interface DeliverRequest {
  postId: mongoose.Types.ObjectId;
  creatorId: string;
  content: DeliveryContent;
}

/**
 * Delivers a Post that has just been published to every current Follower of
 * its Creator. Queues the emails and returns; the sending happens in the
 * Delivery queue, so publishing never waits on an email provider. A Creator
 * with no Followers still uses the Post's one Delivery: it reached nobody, and
 * it will not be sent later. Returns undefined when the Post was delivered
 * before.
 */
export async function deliverPost(
  { postId, creatorId, content }: DeliverRequest,
  now = new Date()
): Promise<{ followers: number; at: Date } | undefined> {
  const followers = await Follower.find(confirmedOf(creatorId)).select('_id').lean();
  const { email: replyTo } = await creatorProfile(creatorId);

  let delivery;
  try {
    delivery = await Delivery.create({
      post: postId,
      creator: creatorId,
      followers: followers.length,
      content,
      replyTo,
    });
  } catch (error) {
    if (isDuplicate(error)) return undefined;
    throw error;
  }

  if (followers.length > 0) {
    await QueuedEmail.insertMany(
      followers.map((f) => ({ delivery: delivery._id, follower: f._id, creator: creatorId, dueAt: now })),
      { ordered: false }
    );
  }
  return { followers: followers.length, at: delivery.createdAt };
}

export interface WeeklyFollowers {
  /** The Monday a UTC week starts on, as YYYY-MM-DD. */
  weekStart: string;
  /** Followers at the end of that week, or now for the week under way. */
  followers: number;
}

const WEEKS = 8;
const WEEK_MS = 7 * DAY_MS;

/**
 * Followers at the end of each of the last eight UTC weeks, oldest first.
 * A Follower counts from the week they confirmed until the week they stopped:
 * current Followers from their confirmation, and those who left from the
 * anonymous record their stop kept.
 */
export async function weeklyFollowers(creatorId: string, now = new Date()): Promise<WeeklyFollowers[]> {
  const creator = new mongoose.Types.ObjectId(creatorId);
  const thisWeek = startOfUtcWeek(now);
  const weeks = Array.from({ length: WEEKS }, (_, i) => new Date(thisWeek.getTime() - (WEEKS - 1 - i) * WEEK_MS));

  return Promise.all(
    weeks.map(async (weekStart) => {
      const end = new Date(Math.min(weekStart.getTime() + WEEK_MS, now.getTime() + 1));
      const [staying, departed] = await Promise.all([
        Follower.countDocuments({ creator, state: 'confirmed', confirmedAt: { $lt: end } }),
        Departure.countDocuments({ creator, followedAt: { $lt: end }, stoppedAt: { $gte: end } }),
      ]);
      return { weekStart: weekStart.toISOString().slice(0, 10), followers: staying + departed };
    })
  );
}

export interface DeliveryFigures {
  followers: number;
  weeklyGain: number;
  /** Delivery emails actually sent in the window. */
  delivered: number;
  deliveries: number;
  lastDeliveryAt?: Date;
  weekly: WeeklyFollowers[];
}

/** Growth Analytics' view of a Creator's Followers, for the window starting at `since`. */
export async function deliveryFigures(creatorId: string, since: Date): Promise<DeliveryFigures> {
  const creator = new mongoose.Types.ObjectId(creatorId);
  const [followers, weeklyGain, delivered, deliveries, last, weekly] = await Promise.all([
    followerCount(creatorId),
    followersGainedSince(creatorId, since),
    QueuedEmail.countDocuments({ creator, state: 'sent', sentAt: { $gte: since } }),
    Delivery.countDocuments({ creator, createdAt: { $gte: since } }),
    Delivery.findOne({ creator }).sort({ createdAt: -1 }).select('createdAt').lean(),
    weeklyFollowers(creatorId),
  ]);
  return { followers, weeklyGain, delivered, deliveries, lastDeliveryAt: last?.createdAt, weekly };
}
