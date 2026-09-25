import 'dotenv/config';
import mongoose from 'mongoose';
import { clearPostAuthorRole } from '../src/migrations/clearPostAuthorRole';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const cleared = await clearPostAuthorRole();
  console.log(`Cleared the stamped role from ${cleared} post(s).`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('clear-post-author-role failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
