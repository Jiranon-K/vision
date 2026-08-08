import mongoose, { Document, Schema } from 'mongoose';

// Records that an Excerpt Suggestion was issued — never that it was accepted.
// The Post gains no field for this: the suggestion lands in an editable field,
// so a stored "AI-written" flag on the Post could never stay honest. This is
// the only record of the event, kept separate from Analytics (a Reader's View)
// because a Creator asking for a suggestion is not a Reader reading.
export interface IExcerptSuggestion extends Document {
  creator: mongoose.Types.ObjectId;
  // Optional: a Creator can ask before the Post has ever been saved.
  post?: mongoose.Types.ObjectId;
  text: string;
  // Domain-level provenance only (ADR 0003) — never which provider answered.
  source: 'provider' | 'fallback';
  createdAt: Date;
  updatedAt: Date;
}

const ExcerptSuggestionSchema = new Schema<IExcerptSuggestion>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    text: { type: String, required: true },
    source: { type: String, enum: ['provider', 'fallback'], required: true },
  },
  { timestamps: true }
);

// Both threshold queries join on the Post this suggestion belongs to (adoption:
// which published Posts have one; kept-unedited: compare its text against the
// Post's current Excerpt).
ExcerptSuggestionSchema.index({ post: 1 });
// Scopes either query to a rolling window (e.g. the last 30 days).
ExcerptSuggestionSchema.index({ createdAt: -1 });

export default mongoose.model<IExcerptSuggestion>(
  'ExcerptSuggestion',
  ExcerptSuggestionSchema
);
