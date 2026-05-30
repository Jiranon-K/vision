import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostContent from "@/components/blog/PostContent";
import ReadingProgress from "@/components/blog/ReadingProgress";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ViewTracker from "@/components/blog/ViewTracker";
import { getPostBySlug, getPublishedPosts, type Post } from "@/lib/posts";
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

// Next.js delivers non-ASCII dynamic segments percent-encoded. Decode once here
// so the API client doesn't double-encode (which 404s slugs with Thai/unicode).
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  let post = null;
  try {
    post = await getPostBySlug(safeDecode(slug));
  } catch {
    post = null;
  }

  if (!post) {
    return { title: "Post not found" };
  }

  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
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
    post = await getPostBySlug(safeDecode(slug));
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  // Related: prefer same category, fall back to latest. coverImage is excluded
  // from the list endpoint, so this payload stays lean.
  let related: Post[] = [];
  try {
    const others = (await getPublishedPosts()).filter(
      (p) => p.slug !== post.slug,
    );
    const sameCategory = others.filter((p) => p.category === post.category);
    related = (sameCategory.length > 0 ? sameCategory : others).slice(0, 3);
  } catch {
    related = [];
  }

  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  // base64 cover images can't be used as crawler og:image; point the schema
  // image at the site's dynamic OG image instead.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${SITE_URL}/opengraph-image`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <main className="min-h-screen bg-white">
      <ReadingProgress />
      <Navbar />
      <ViewTracker id={post.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-10 lg:px-8 py-12 md:py-16">
        <Breadcrumbs title={post.title} />

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover rounded-3xl border-2 border-brand-dark mb-10"
          />
        )}

        <div className="flex items-center gap-3 mb-6">
          <span className="bg-brand-lime text-brand-dark text-sm font-semibold px-4 py-1.5 rounded-full">
            {post.category}
          </span>
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

        <TableOfContents collapsible className="lg:hidden mb-8" />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12">
          <article className="min-w-0">
            <PostContent content={post.content} />
            <ShareButtons url={url} />
          </article>

          <aside className="hidden lg:block">
            <TableOfContents className="sticky top-24" />
          </aside>
        </div>

        <RelatedPosts posts={related} />
      </div>

      <Footer />
    </main>
  );
}
