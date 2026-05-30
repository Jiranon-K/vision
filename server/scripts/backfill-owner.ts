// One-off migration: assign an owner to posts created before the `owner` field
// existed. Run AFTER an admin exists (promote-admin or an admin login). From the
// server dir:  bun run backfill-owner
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Post from '../src/models/Post';

async function findAdmin() {
  const byRole = await User.findOne({ role: 'admin' });
  if (byRole) return byRole;

  // Fallback: match ADMIN_EMAILS even if the role hasn't been persisted yet.
  const emails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  for (const email of emails) {
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      email: { $regex: `^${escaped}$`, $options: 'i' },
    });
    if (user) return user;
  }
  return null;
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
      'No admin user found. Run "bun run promote-admin <email>" (or log in as an admin) first.'
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
