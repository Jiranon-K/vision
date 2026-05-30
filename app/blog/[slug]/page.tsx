import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostContent from "@/components/blog/PostContent";
import { getPostBySlug } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 300;

type Params = { slug: string };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  let post = null;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) {
    return { title: "Post not found" };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      siteName: SITE_NAME,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  let post = null;
  try {
    post = await getPostBySlug(slug);
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="max-w-3xl mx-auto px-4 md:px-10 lg:px-0 py-12 md:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-brand-dark/50 hover:text-brand-dark text-sm font-medium mb-8 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to blog
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <span className="bg-brand-lime text-brand-dark text-sm font-semibold px-4 py-1.5 rounded-full">
            {post.category}
          </span>
          <span className="text-brand-dark/40 text-sm">{post.tag}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-brand-dark leading-[1.1] tracking-tight mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 pb-8 mb-8 border-b border-brand-dark/10">
          <div className="w-11 h-11 rounded-full bg-brand-dark flex items-center justify-center text-brand-lime font-bold text-sm">
            {post.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-brand-dark text-sm font-semibold">
              {post.author.name}
            </p>
            <p className="text-brand-dark/40 text-xs">
              {formatDate(post.date)} · {post.readTime}
            </p>
          </div>
        </div>

        <PostContent content={post.content} />
      </article>

      <Footer />
    </main>
  );
}
