"use client";

import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import Navbar from "@/components/Navbar";
import FeaturedCard from "@/components/blog/FeaturedCard";
import BlogCard from "@/components/blog/BlogCard";
import NewsletterCta from "@/components/blog/NewsletterCta";
import { blogPosts, categories } from "@/components/data/blog-data";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const didAnimateHero = useRef(false);
  const didAnimateGrid = useRef(false);

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts.filter((p) => !p.featured)
      : blogPosts.filter((p) => p.category === activeCategory && !p.featured);

  const featuredPosts = blogPosts.filter((p) => p.featured);

  /* ── Hero + filter animation ── */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimateHero.current) {
            didAnimateHero.current = true;

            animate(hero.querySelectorAll(".hero-anim"), {
              opacity: [0, 1],
              translateY: [30, 0],
              delay: stagger(100),
              duration: 700,
              easing: "easeOutCubic",
            });

            if (filterRef.current) {
              animate(filterRef.current.querySelectorAll("button"), {
                opacity: [0, 1],
                translateY: [16, 0],
                delay: stagger(50, { start: 400 }),
                duration: 500,
                easing: "easeOutCubic",
              });
            }

            if (featuredRef.current) {
              animate(featuredRef.current.querySelectorAll(".featured-card"), {
                opacity: [0, 1],
                translateY: [40, 0],
                delay: stagger(120, { start: 500 }),
                duration: 800,
                easing: "easeOutExpo",
              });
            }

            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  /* ── Grid cards animation ── */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimateGrid.current) {
            didAnimateGrid.current = true;

            animate(grid.querySelectorAll(".blog-card"), {
              opacity: [0, 1],
              translateY: [40, 0],
              delay: stagger(80),
              duration: 650,
              easing: "easeOutExpo",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.08 },
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ━━━ Hero Section ━━━ */}
      <div
        ref={heroRef}
        className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 pt-12 md:pt-20 pb-8"
      >
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="hero-anim opacity-0">
            <span className="bg-brand-lime text-brand-dark text-base font-semibold px-3 py-1 rounded-[7px]">
              Blog
            </span>
          </div>
          <h1 className="hero-anim opacity-0 text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-[1.1] tracking-tight">
            Insights & Ideas for Modern Creators
          </h1>
          <p className="hero-anim opacity-0 text-lg md:text-xl text-brand-dark/60 leading-relaxed max-w-xl">
            Tips, strategies, and deep dives to help you grow your audience and
            amplify your content across every platform.
          </p>
        </div>

        {/* ━━━ Category Filter ━━━ */}
        <div ref={filterRef} className="flex flex-wrap gap-3 mt-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 opacity-0 cursor-pointer ${
                activeCategory === cat
                  ? "bg-brand-dark text-brand-lime shadow-md"
                  : "bg-brand-gray text-brand-dark hover:bg-brand-dark/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ Featured Posts ━━━ */}
      <div
        ref={featuredRef}
        className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 pb-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredPosts.map((post) => (
            <FeaturedCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      {/* ━━━ All Posts Grid ━━━ */}
      <section className="bg-brand-gray py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-dark">
              {activeCategory === "All" ? "Latest Articles" : activeCategory}
            </h2>
            <span className="text-brand-dark/40 text-sm font-medium">
              {filteredPosts.length} article{filteredPosts.length !== 1 && "s"}
            </span>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-brand-dark/40 text-lg">
                No articles found in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ━━━ Newsletter CTA ━━━ */}
      <NewsletterCta />
    </main>
  );
}
