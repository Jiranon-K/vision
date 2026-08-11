/**
 * A unique index rejecting a write is often the answer rather than a failure:
 * it is how two Posts created at the same moment get distinct Slugs, and how a
 * repeat View is recognised without a read-then-write race.
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}
