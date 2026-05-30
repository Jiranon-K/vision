import Link from "next/link";
import FeaturedPostsGrid from "./FeaturedPostsGrid";
import { getPublishedPosts, type Post } from "@/lib/posts";

const FeaturedPosts = async () => {
  let posts: Post[] = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    return null;
  }

  if (posts.length === 0) {
    return null;
  }

  // Featured first, then newest, capped at 3.
  const featured = posts.filter((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);
  const selected = [...featured, ...rest].slice(0, 3);

  return (
    <section className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="bg-brand-lime px-3 py-1 rounded-[10px] transform -rotate-1 shadow-[4px_4px_0px_0px_#191A23] w-fit">
            <h2 className="text-3xl md:text-4xl font-bold px-1 text-brand-dark">
              From the blog
            </h2>
          </div>
          <p className="text-lg text-brand-dark/70 max-w-md leading-relaxed">
            Fresh insights, strategies, and stories from creators using Vision.
          </p>
        </div>
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 text-brand-dark font-semibold hover:gap-3 transition-all duration-300 whitespace-nowrap"
        >
          View all
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="group-hover:translate-x-1 transition-transform"
          >
            <path
              d="M5 12H19M19 12L13 6M19 12L13 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      <FeaturedPostsGrid posts={selected} />
    </section>
  );
};

export default FeaturedPosts;
