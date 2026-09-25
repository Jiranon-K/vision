import User from '../models/User';

export async function renameRole(from: string, to: string): Promise<number> {
  const result = await User.collection.updateMany(
    { role: from },
    { $set: { role: to } }
  );
  return result.modifiedCount;
}
