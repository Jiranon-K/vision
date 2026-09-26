import mongoose, { Document, Schema } from 'mongoose';

// How much of one UTC day's platform-wide email limit has been used. A counter
// incremented conditionally is what lets several API instances share the
// limit without overshooting it.
export interface IDailyAllowance extends Document {
  day: Date;
  used: number;
}

const DailyAllowanceSchema = new Schema<IDailyAllowance>({
  day: { type: Date, required: true, unique: true },
  used: { type: Number, default: 0 },
});

export default mongoose.model<IDailyAllowance>('DailyAllowance', DailyAllowanceSchema);
