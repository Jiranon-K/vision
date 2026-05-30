import type { Post } from "@/lib/posts";
import BlogCard from "./BlogCard";

// BlogCard ships with `opacity-0` (revealed by BlogList's anime.js stagger).
// There's no animator on the article page, so force the cards visible here.
export default function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-brand-dark/10 pt-12 mt-4">
      <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-8">
        Keep reading
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&_.blog-card]:opacity-100">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
