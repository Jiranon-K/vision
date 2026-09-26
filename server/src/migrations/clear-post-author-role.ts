import { Post } from '../modules/posts';

export async function clearPostAuthorRole(): Promise<number> {
  const result = await Post.updateMany(
    { 'author.role': { $exists: true } },
    { $unset: { 'author.role': '' } },
    { strict: false }
  );
  return result.modifiedCount;
}
