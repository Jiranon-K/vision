// One-off: promote an existing user to admin (for users who won't re-login, where
// the ADMIN_EMAILS self-heal on login wouldn't fire). Run from the server dir:
//   bun run promote-admin user@example.com
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: bun run promote-admin <email>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({
    email: { $regex: `^${escaped}$`, $options: 'i' },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();
  console.log(`Promoted ${user.email} to admin.`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('promote-admin failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
