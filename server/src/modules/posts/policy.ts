import { forbidden, notFound } from '../../platform/errors';
import type { Actor } from '../auth';

export type { Actor } from '../auth';

type SignedIn = Exclude<Actor, { kind: 'reader' }>;

export const ADVERTISED_ACTIONS = [
  'edit',
  'publish',
  'delete',
  'withhold',
  'restore',
] as const;
export type AdvertisedAction = (typeof ADVERTISED_ACTIONS)[number];
export type PostAction = 'list' | 'read' | AdvertisedAction;

export type PostStatus = 'Published' | 'Draft';

export interface PostResource {
  owner?: unknown;
  status: PostStatus;
  withheld?: boolean;
}


const isPublic = (post: PostResource): boolean =>
  post.status === 'Published' && post.withheld !== true;

const owns = (actor: SignedIn, post: PostResource): boolean =>
  post.owner != null && String(post.owner) === actor.id;

export function can(
  actor: Actor,
  action: PostAction,
  post: PostResource
): boolean {
  switch (actor.kind) {
    case 'reader':
      return (action === 'list' || action === 'read') && isPublic(post);
    case 'creator':
      if (action === 'read') return owns(actor, post) || isPublic(post);
      if (action === 'withhold' || action === 'restore') return false;
      return owns(actor, post);
    case 'admin':
      if (action === 'list' || action === 'read') return true;
      if (action === 'withhold') return isPublic(post);
      if (action === 'restore') return post.withheld === true;
      return owns(actor, post);
  }
}

export function advertisedActions(
  actor: Actor,
  post: PostResource
): AdvertisedAction[] | undefined {
  if (actor.kind === 'reader') return undefined;
  return ADVERTISED_ACTIONS.filter((action) => can(actor, action, post));
}

export function actionsForUpdate(
  post: PostResource,
  update: { status?: PostStatus }
): PostAction[] {
  const publishing =
    update.status === 'Published' && post.status !== 'Published';
  return publishing ? ['edit', 'publish'] : ['edit'];
}

export function listScope(actor: Actor): Record<string, unknown> {
  switch (actor.kind) {
    case 'reader':
      return { status: 'Published', withheld: { $ne: true } };
    case 'creator':
      return { owner: actor.id };
    case 'admin':
      return {};
  }
}

export function authorize<P extends PostResource>(
  actor: Actor,
  action: PostAction,
  post: P | null | undefined
): asserts post is P {
  if (!post) throw notFound('Post not found');
  if (can(actor, action, post)) return;
  if (action === 'list' || action === 'read') throw notFound('Post not found');
  throw forbidden(`You do not have permission to ${action} this post`);
}
