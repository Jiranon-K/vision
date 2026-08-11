import Post from '../models/Post';

// \p{M} keeps combining marks. Without it a Thai title loses its vowel and tone
// marks — "การเขียนบทความ" became "การเข-ยนบทความ" — which is not a word any
// Reader would recognise in a URL.
export function normalizeSlug(value: string): string {
  const base = value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
  return base || 'post';
}

/**
 * True when any other Post currently answers at this address, or used to.
 * Retained addresses participate so a released Slug can never start pointing at
 * a different Post — an address that silently changes owner is worse than one
 * that fails.
 */
export async function slugIsTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await Post.findOne({
    $or: [{ slug }, { previousSlugs: slug }],
  }).select('_id');
  if (!existing) return false;
  return !excludeId || String(existing._id) !== excludeId;
}

/**
 * A free address derived from a title. Uniqueness is the database's to enforce
 * — this only proposes a candidate, and the caller retries on the unique index
 * rejecting it. The previous implementation queried in a loop and then saved,
 * so two Posts created at the same moment both found the same candidate free.
 */
export async function proposeSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = normalizeSlug(title);

  let candidate = base;
  let counter = 1;
  while (await slugIsTaken(candidate, excludeId)) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

interface DuplicateKeyError {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

export function isDuplicateSlugError(error: unknown): boolean {
  const candidate = error as DuplicateKeyError;
  return candidate?.code === 11000 && Boolean(candidate.keyPattern?.slug);
}

/**
 * Save through the unique index, treating its rejection as the signal to try
 * the next candidate. This is what makes concurrent creation of two Posts with
 * the same title produce two Posts rather than one Post and one server error.
 */
export async function saveWithUniqueSlug<T extends { slug: string; save(): Promise<unknown> }>(
  doc: T,
  baseTitle: string,
  attempts = 5
): Promise<void> {
  const base = normalizeSlug(baseTitle);
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await doc.save();
      return;
    } catch (error) {
      if (!isDuplicateSlugError(error)) throw error;
      doc.slug = `${base}-${Date.now().toString(36)}-${attempt}`;
    }
  }
  await doc.save();
}
