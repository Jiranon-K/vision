import { isReadableByReaders } from '../posts';
import { FRONTEND_URL } from '../../platform/emails/client';
import { sendDeliveryEmail } from '../../platform/emails/send';
import { logger } from '../../platform/logger';
import { startOfUtcDay } from '../../platform/time';
import DailyAllowance from './daily-allowance.model';
import Delivery from './delivery.model';
import Follower from './follower.model';
import QueuedEmail from './queued-email.model';

// The Delivery queue. Publishing only writes one waiting email per Follower;
// this drains them within a platform-wide daily limit, so the email provider's
// quota is never exceeded and a provider outage delays email instead of
// failing a publish (ADR 0002's rule, applied to email).

/** Delivery emails the platform may send per UTC day during the Free beta. */
export const dailyLimit = (): number => Number(process.env.DELIVERY_DAILY_LIMIT) || 100;

/** Attempts before an email is given up on. */
export const MAX_ATTEMPTS = 5;

// An email claimed by an instance that then died is reclaimed after this long.
const STALE_CLAIM_MS = 10 * 60 * 1000;

// Backoff between attempts: 5, 10, 20, 40 minutes.
const retryDelayMs = (attempts: number): number => 5 * 60 * 1000 * 2 ** (attempts - 1);

/** Public origin of this API, for the one-click stop link a mail client calls. */
const apiOrigin = (): string => process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3001}`;

export async function sendableToday(now = new Date(), limit = dailyLimit()): Promise<number> {
  const today = await DailyAllowance.findOne({ day: startOfUtcDay(now) }).lean();
  return Math.max(0, limit - (today?.used ?? 0));
}

// Takes one email from today's allowance, or reports there is none left. The
// condition and the increment are one operation, so concurrent drains on
// several instances cannot overshoot the limit between them.
async function takeFromToday(day: Date, limit: number): Promise<boolean> {
  await DailyAllowance.updateOne({ day }, { $setOnInsert: { used: 0 } }, { upsert: true }).catch(
    (error: { code?: number }) => {
      if (error.code !== 11000) throw error;
    }
  );
  return (await DailyAllowance.findOneAndUpdate({ day, used: { $lt: limit } }, { $inc: { used: 1 } })) !== null;
}

const giveBackToToday = (day: Date) => DailyAllowance.updateOne({ day }, { $inc: { used: -1 } });

const claimNext = (now: Date) =>
  QueuedEmail.findOneAndUpdate(
    {
      $or: [
        { state: 'waiting', dueAt: { $lte: now } },
        { state: 'claimed', claimedAt: { $lt: new Date(now.getTime() - STALE_CLAIM_MS) } },
      ],
    },
    { $set: { state: 'claimed', claimedAt: now } },
    { sort: { dueAt: 1 }, new: true }
  );

export interface DrainResult {
  sent: number;
  failed: number;
  /** True when emails were left waiting because today's limit ran out. */
  limited: boolean;
}

/**
 * Sends waiting Delivery emails until none are due or today's limit is spent.
 * `now` is explicit so the limit, the day rollover and retries can be tested.
 */
export async function drainDeliveries(
  now = new Date(),
  { limit = dailyLimit() }: { limit?: number } = {}
): Promise<DrainResult> {
  const day = startOfUtcDay(now);
  const result: DrainResult = { sent: 0, failed: 0, limited: false };

  for (;;) {
    if (!(await takeFromToday(day, limit))) {
      result.limited = (await QueuedEmail.exists({ state: 'waiting' })) !== null;
      return result;
    }

    const email = await claimNext(now);
    if (!email) {
      await giveBackToToday(day);
      return result;
    }

    const [follower, delivery] = await Promise.all([
      Follower.findById(email.follower).select('email stopToken state').lean(),
      Delivery.findById(email.delivery).lean(),
    ]);

    // Checked at send time, not only at publish: the Follower may have
    // stopped, and the Post may have been Withheld, returned to Draft or
    // deleted since it was delivered. Either way nobody should receive it.
    const stillWanted =
      follower?.state === 'confirmed' && delivery !== null && (await isReadableByReaders(delivery.post));
    if (!stillWanted) {
      await QueuedEmail.deleteOne({ _id: email._id });
      await giveBackToToday(day);
      continue;
    }

    try {
      await sendDeliveryEmail({
        ...delivery.content,
        to: follower.email,
        replyTo: delivery.replyTo,
        readUrl: `${FRONTEND_URL}/blog/${encodeURIComponent(delivery.content.slug)}?from=delivery`,
        stopUrl: `${FRONTEND_URL}/follow/stop?token=${follower.stopToken}`,
        oneClickStopUrl: `${apiOrigin()}/api/followers/stop/${follower.stopToken}`,
      });
      await QueuedEmail.updateOne(
        { _id: email._id },
        { $set: { state: 'sent', sentAt: now }, $inc: { attempts: 1 } }
      );
      result.sent += 1;
    } catch (error) {
      await giveBackToToday(day);
      const attempts = email.attempts + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      await QueuedEmail.updateOne(
        { _id: email._id },
        {
          $set: {
            state: exhausted ? 'failed' : 'waiting',
            attempts,
            dueAt: new Date(now.getTime() + retryDelayMs(attempts)),
          },
        }
      );
      result.failed += 1;
      logger.warn({ err: error, attempts, exhausted }, 'Delivery email failed');
    }
  }
}

/** Drains the queue on an interval for as long as the process runs. */
export function startDeliveryQueue(everyMs = 60_000): () => void {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    drainDeliveries()
      .catch((error) => logger.error({ err: error }, 'Delivery queue drain failed'))
      .finally(() => {
        running = false;
      });
  }, everyMs);
  timer.unref();
  return () => clearInterval(timer);
}
