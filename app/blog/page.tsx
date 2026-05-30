import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterCta from "@/components/blog/NewsletterCta";
import BlogList from "@/components/blog/BlogList";
import { getPublishedPosts, type Post } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, strategies, and deep dives to help you grow your audience and " +
    "amplify your content across every platform.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 300;

export default async function BlogPage() {
  let posts: Post[] = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    posts = [];
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <BlogList posts={posts} />
      <NewsletterCta />
      <Footer />
    </main>
  );
}
