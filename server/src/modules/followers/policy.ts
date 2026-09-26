import { notFound } from '../../platform/errors';
import type { Actor } from '../auth';

// Who may see what about a Creator's Followers (ADR 0004, ADR 0009). The
// addresses belong to the Creator alone; an Admin supports the platform with a
// count and never handles a Reader's address.

export type FollowersAction = 'list' | 'count';

export function can(actor: Actor, action: FollowersAction, creatorId: string): boolean {
  switch (actor.kind) {
    case 'reader':
      return false;
    case 'creator':
      return actor.id === creatorId;
    case 'admin':
      return action === 'count' || actor.id === creatorId;
  }
}

/** Refuses as "not found", so a refusal does not confirm the Creator exists. */
export function authorize(actor: Actor, action: FollowersAction, creatorId: string): void {
  if (!can(actor, action, creatorId)) throw notFound('Not found');
}

/** The Creator whose own Followers a signed-in actor is asking about. */
export function ownCreatorId(actor: Actor): string {
  if (actor.kind === 'reader') throw notFound('Not found');
  return actor.id;
}
