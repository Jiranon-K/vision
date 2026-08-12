import type { Request } from 'express';
import { badRequest } from '../errors';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/**
 * Opaque on purpose. Two orderings need two cursors — creation order can be
 * expressed as "everything after this Post", a relevance ranking cannot — and
 * keeping the composition private is what lets them share one interface.
 */
export type Cursor =
  | { kind: 'created'; createdAt: Date; id: string }
  | { kind: 'offset'; offset: number };

export function encodeCursor(cursor: Cursor): string {
  const raw =
    cursor.kind === 'created'
      ? `c:${cursor.createdAt.toISOString()}:${cursor.id}`
      : `o:${cursor.offset}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

export function decodeCursor(value: string): Cursor {
  let raw: string;
  try {
    raw = Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    throw badRequest('Invalid cursor');
  }

  if (raw.startsWith('o:')) {
    const offset = Number(raw.slice(2));
    if (!Number.isInteger(offset) || offset < 0) {
      throw badRequest('Invalid cursor');
    }
    return { kind: 'offset', offset };
  }

  const match = /^c:(.+):([0-9a-fA-F]{24})$/.exec(raw);
  const createdAt = match ? new Date(match[1]) : undefined;
  if (!match || !createdAt || Number.isNaN(createdAt.getTime())) {
    throw badRequest('Invalid cursor');
  }
  return { kind: 'created', createdAt, id: match[2] };
}

/**
 * A requested size above the maximum is clamped rather than refused, so a
 * client bug degrades instead of failing. A malformed one is refused, because
 * silently reinterpreting a typo is worse than saying so.
 */
export function readLimit(query: Request['query']): number {
  const raw = query.limit;
  if (raw === undefined) return DEFAULT_PAGE_SIZE;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw badRequest('limit must be a positive whole number');
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function readCursor(query: Request['query']): Cursor | undefined {
  const raw = query.cursor;
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') throw badRequest('Invalid cursor');
  return decodeCursor(raw);
}
