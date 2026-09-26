// One-off migration: assign an owner to posts created before the `owner` field
// existed. Run AFTER an admin exists (promote-admin or an admin login). From the
// server dir:  bun run backfill-owner
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import { Post } from '../src/modules/posts';

async function findAdmin() {
  return User.findOne({ role: 'admin' });
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const admin = await findAdmin();
  if (!admin) {
    console.error(
      'No Admin found. Register the first Admin with an email listed in ADMIN_EMAILS first.'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const result = await Post.updateMany(
    { owner: { $exists: false } },
    { $set: { owner: admin._id } }
  );
  console.log(
    `Backfilled ${result.modifiedCount} post(s) → owner ${admin.email}.`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('backfill-owner failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
