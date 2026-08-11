import mongoose, { Document, Schema } from 'mongoose';

/**
 * One row per Reader per Post per window, used only to recognise a repeat and
 * ignore it. `reader` is a salted hash of request characteristics: the purpose
 * is deduplication, not identity, and once the salt rotates the value is
 * useless for following a Reader between Posts — which is what keeps counting
 * Views compatible with a blog that requires no account to read.
 */
export interface IViewRecord extends Document {
  post: mongoose.Types.ObjectId;
  reader: string;
  expiresAt: Date;
}

const ViewRecordSchema = new Schema<IViewRecord>({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  reader: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

ViewRecordSchema.index({ post: 1, reader: 1 }, { unique: true });
// Rows remove themselves, so nothing needs pruning and the collection is
// bounded by traffic inside the window rather than by traffic ever.
ViewRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IViewRecord>('ViewRecord', ViewRecordSchema);
