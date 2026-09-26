import type { Metadata } from "next";
import Navbar from "@/shared/layout/navbar";
import Footer from "@/shared/layout/footer";
import { CreatorCta, BlogList } from "@/features/blog";
import { getPublishedPosts } from "@/features/blog/server";
import { type PostSummary } from "@/features/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, strategies, and deep dives to help you grow an Audience you " +
    "keep, and reach your Readers directly.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 300;

export default async function BlogPage() {
  let posts: PostSummary[] = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    posts = [];
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <BlogList posts={posts} />
      <CreatorCta />
      <Footer />
    </main>
  );
}
