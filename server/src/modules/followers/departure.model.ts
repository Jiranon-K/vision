import mongoose, { Document, Schema } from 'mongoose';

// That someone followed a Creator from one date to another, and nothing else.
// A Follower who stops is deleted with their address (ADR 0009); this is what
// remains, so Growth Analytics can still say how many Followers a Creator had
// in a past week. No address, no token, nothing that points back at a person.
export interface IDeparture extends Document {
  creator: mongoose.Types.ObjectId;
  followedAt: Date;
  stoppedAt: Date;
}

const DepartureSchema = new Schema<IDeparture>({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followedAt: { type: Date, required: true },
  stoppedAt: { type: Date, required: true },
});

DepartureSchema.index({ creator: 1, stoppedAt: 1 });

export default mongoose.model<IDeparture>('Departure', DepartureSchema);
