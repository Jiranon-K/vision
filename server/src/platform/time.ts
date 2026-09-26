export const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC midnight of the day `at` falls on: the unit daily figures are kept in. */
export function startOfUtcDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/** The first moment of a window of `days` UTC days ending with today's. */
export function startOfLastDays(days: number, now = new Date()): Date {
  return new Date(startOfUtcDay(now).getTime() - (days - 1) * DAY_MS);
}
