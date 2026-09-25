import 'dotenv/config';
import mongoose from 'mongoose';
import { renameRole } from '../src/migrations/renameRole';

async function main(): Promise<void> {
  const [from, to] = process.argv.slice(2);
  if (!from || !to) {
    console.error('Usage: bun run rename-role <from> <to>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const changed = await renameRole(from, to);
  console.log(`rename-role ${from} -> ${to}: ${changed} record(s) changed.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('rename-role failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
