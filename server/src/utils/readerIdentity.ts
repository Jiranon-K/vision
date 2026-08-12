import crypto from 'crypto';
import type { Request } from 'express';

// A window in minutes still counts a Reader who returns after lunch; a window
// in days erases genuine repeat readership. Hours is the compromise, and it is
// one named decision rather than a number scattered through the code.
export const VIEW_DEDUPE_WINDOW_HOURS =
  Number(process.env.VIEW_DEDUPE_WINDOW_HOURS) || 12;

// Rotating with the window means a derived value cannot be used to follow a
// Reader across Posts for longer than the window itself.
function currentSalt(now: Date): string {
  const base = process.env.VIEW_DEDUPE_SALT || 'vision-view-dedupe';
  const bucket = Math.floor(
    now.getTime() / (VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000)
  );
  return `${base}:${bucket}`;
}

/** Not an identity. A value that recognises "this again" and nothing else. */
export function deriveReader(req: Request, now = new Date()): string {
  const material = [
    req.ip ?? '',
    req.header('user-agent') ?? '',
    req.header('accept-language') ?? '',
  ].join('|');

  return crypto
    .createHmac('sha256', currentSalt(now))
    .update(material)
    .digest('hex');
}

// Perfect detection is not the goal; removing the obvious bulk is. Indexing is
// not readership, and counting it makes the Creator's trend a measurement of
// crawler schedules.
const CRAWLER_PATTERN =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|embedly|preview|monitor|curl|wget|headless|lighthouse/i;

export function looksLikeCrawler(req: Request): boolean {
  const agent = req.header('user-agent');
  if (!agent) return true;
  return CRAWLER_PATTERN.test(agent);
}
