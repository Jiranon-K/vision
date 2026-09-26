import type { Metadata } from "next";
import Navbar from "@/shared/layout/navbar";
import {
  CtaBlock as Ctablock,
  HomeHeader as Header,
  HomeServices as Services,
  Process,
} from "@/features/marketing";
import { FeaturedPosts } from "@/features/marketing/server";
import Footer from "@/shared/layout/footer";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/shared/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Navbar />
      <Header />
      <Services />
      <Process />
      <FeaturedPosts />
      <Ctablock />
      <Footer />
    </main>
  );
}
