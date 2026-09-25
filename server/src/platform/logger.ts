import pino, { type Logger, type DestinationStream } from 'pino';

// Redaction is configured on the logger rather than remembered at each call
// site: a policy applied here cannot be forgotten by the next person to add a
// line, and the log must never become a credential store.
const REDACT = [
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  '*.password',
  '*.token',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

function defaultLevel(): string {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (process.env.NODE_ENV === 'test') return 'silent';
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
}

// JSON to stdout, one line per event. No file transport and no rotation: the
// runtime platform owns where logs go, and an application that writes files is
// harder to containerise, not easier.
export function createLogger(destination?: DestinationStream): Logger {
  return pino(
    {
      level: defaultLevel(),
      redact: { paths: REDACT, censor: '[redacted]' },
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    destination
  );
}

export const logger = createLogger();

export type { Logger };
