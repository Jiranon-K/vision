import type { Store, ClientRateLimitInfo, IncrementResponse } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient, type RedisClientType } from 'redis';
import { logger } from '../logger';

// This is the seam. It has had one adapter and a warning that changed nothing:
// production printed "consider Redis" and then used the in-memory store anyway,
// so every limit was per process and a restart handed an attacker a fresh
// allowance. A second adapter is what makes it a real seam.
export type StoreKind = 'memory' | 'redis';

/**
 * What a limiter should do when the shared store cannot answer.
 *
 * `closed` for anything protecting credentials or spend — an outage of the
 * store must not be an opening. `open` for the general budget: failing the
 * whole platform because a rate-limit store blinked trades a small risk for a
 * large outage.
 */
export type FailurePolicy = 'open' | 'closed';

let client: RedisClientType | undefined;

export function selectedStoreKind(): StoreKind {
  return process.env.RATE_LIMIT_REDIS_URL ? 'redis' : 'memory';
}

/**
 * A production server with no shared store configured refuses to start. The
 * previous warning is the proof that a message alone does not change what gets
 * deployed.
 */
export function assertStoreIsUsable(): void {
  if (process.env.NODE_ENV === 'production' && selectedStoreKind() === 'memory') {
    throw new Error(
      'RATE_LIMIT_REDIS_URL is required in production: an in-memory rate limit ' +
        'store is per process, so every limit is multiplied by the instance ' +
        'count and reset by every deploy.'
    );
  }
  logger.info({ store: selectedStoreKind() }, 'Rate limit store selected');
}

function redisClient(): RedisClientType {
  if (!client) {
    client = createClient({ url: process.env.RATE_LIMIT_REDIS_URL });
    client.on('error', (err) =>
      logger.error({ err }, 'Rate limit store connection error')
    );
    void client.connect();
  }
  return client;
}

// Wrapping the store rather than each limiter keeps the policy in one place and
// out of the six call sites that would otherwise each have to remember it.
function withFailurePolicy(store: Store, policy: FailurePolicy): Store {
  const permissive = (): IncrementResponse => ({
    totalHits: 1,
    resetTime: undefined,
  });
  // A count above any configured maximum reads as "over the limit", so a
  // fail-closed limiter answers with its own 429 and message rather than an
  // unexplained server error.
  const refusing = (): IncrementResponse => ({
    totalHits: Number.MAX_SAFE_INTEGER,
    resetTime: undefined,
  });

  return {
    ...store,
    init: store.init?.bind(store),
    async increment(key: string): Promise<IncrementResponse> {
      try {
        return await store.increment(key);
      } catch (err) {
        logger.error({ err, policy }, 'Rate limit store unavailable');
        return policy === 'open' ? permissive() : refusing();
      }
    },
    async decrement(key: string): Promise<void> {
      try {
        await store.decrement(key);
      } catch {
        // Nothing useful to do: the count this would undo was never recorded.
      }
    },
    async resetKey(key: string): Promise<void> {
      try {
        await store.resetKey(key);
      } catch {
        // Best effort; the entry expires on its own.
      }
    },
    async get(key: string): Promise<ClientRateLimitInfo | undefined> {
      try {
        return await store.get?.(key);
      } catch {
        return undefined;
      }
    },
  } as Store;
}

export function createStore(policy: FailurePolicy): Store | undefined {
  if (selectedStoreKind() === 'memory') {
    // undefined selects express-rate-limit's own in-memory store, which is
    // correct for local development and for the test run.
    return undefined;
  }

  const redis = redisClient();
  const store = new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.sendCommand(args) as Promise<never>,
  });

  return withFailurePolicy(store, policy);
}
