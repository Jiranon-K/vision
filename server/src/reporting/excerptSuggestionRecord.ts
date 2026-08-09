import mongoose from 'mongoose';
import ExcerptSuggestion from '../models/ExcerptSuggestion';

// Writing the measurement the thresholds in docs/excerpt-suggestion-metrics.md
// are read from. It lives beside the queries that read it rather than in the
// Post controller: this is the one module that changes when how usage is
// measured changes, and none of it is about a Post's own lifecycle.
//
// Nothing here reaches a provider, so ADR 0002 holds even where a save path
// calls in.

// Neither write may fail a Creator's request. A lost measurement is cheaper
// than a broken button, and the Post is already persisted by the time the
// orphan claim runs.

export async function recordExcerptSuggestion(params: {
  creatorId: string;
  postId?: string;
  text: string;
  source: 'provider' | 'fallback';
}): Promise<void> {
  try {
    await ExcerptSuggestion.create({
      creator: params.creatorId,
      post: params.postId,
      text: params.text,
      source: params.source,
    });
  } catch (error) {
    console.error('Failed to record excerpt suggestion:', error);
  }
}

// A Creator asks for a suggestion while writing, which is before the Post
// exists — so the record has no Post to point at, and both thresholds would
// read near zero however many Creators used the button.
//
// Claiming is deliberately narrow: the single most recent orphan, within one
// editing session's reach. Every widening buys attribution for a suggestion
// that was probably abandoned, at the price of pinning it to a Post it was
// never about — which shows up as a guaranteed non-match in kept-unedited.
const ORPHAN_CLAIM_WINDOW_MS = 6 * 60 * 60 * 1000;

export async function claimOrphanSuggestion(
  creatorId: string,
  postId: mongoose.Types.ObjectId
): Promise<void> {
  try {
    const orphan = await ExcerptSuggestion.findOne({
      creator: creatorId,
      post: null,
      createdAt: { $gte: new Date(Date.now() - ORPHAN_CLAIM_WINDOW_MS) },
    })
      .sort({ createdAt: -1 })
      .select('_id');

    if (orphan) {
      await ExcerptSuggestion.updateOne({ _id: orphan._id }, { $set: { post: postId } });
    }
  } catch (error) {
    console.error('Failed to claim an orphan excerpt suggestion:', error);
  }
}
