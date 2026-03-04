import type { BlogPost } from "@/types/types";

export const categories = [
  "All",
  "Marketing",
  "SEO",
  "Content",
  "Social Media",
  "Analytics",
  "Branding",
];

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "How to Build a Content Strategy That Actually Converts",
    excerpt:
      "Learn the proven framework for creating content that drives engagement and turns readers into loyal customers. We break down each step with real examples.",
    category: "Content",
    tag: "Strategy",
    author: { name: "Sarah Chen", role: "Content Lead" },
    date: "Feb 28, 2026",
    readTime: "8 min read",
    featured: true,
  },
  {
    id: "2",
    title: "SEO in 2026: What Changed and What Still Works",
    excerpt:
      "Search algorithms evolve every year. Here's what top-performing brands are doing differently this year to stay ahead of the curve.",
    category: "SEO",
    tag: "Trends",
    author: { name: "James Park", role: "SEO Specialist" },
    date: "Feb 24, 2026",
    readTime: "6 min read",
    featured: true,
  },
  {
    id: "3",
    title: "The Psychology Behind Viral Social Media Posts",
    excerpt:
      "Why do some posts explode while others fall flat? We dive into the psychological triggers that make content shareable.",
    category: "Social Media",
    tag: "Deep Dive",
    author: { name: "Mia Torres", role: "Social Strategist" },
    date: "Feb 20, 2026",
    readTime: "10 min read",
    featured: false,
  },
  {
    id: "4",
    title: "Google Analytics 5: A Complete Migration Guide",
    excerpt:
      "Step-by-step guide to migrating your analytics setup without losing historical data or breaking your tracking infrastructure.",
    category: "Analytics",
    tag: "Tutorial",
    author: { name: "Alex Kim", role: "Data Analyst" },
    date: "Feb 15, 2026",
    readTime: "12 min read",
    featured: false,
  },
  {
    id: "5",
    title: "Building a Brand Identity from Scratch: Vision's Story",
    excerpt:
      "How we crafted Vision's brand from zero to a recognizable presence — the decisions, mistakes, and wins along the way.",
    category: "Branding",
    tag: "Case Study",
    author: { name: "Sarah Chen", role: "Content Lead" },
    date: "Feb 10, 2026",
    readTime: "7 min read",
    featured: false,
  },
  {
    id: "6",
    title: "5 Email Marketing Automations Every Creator Needs",
    excerpt:
      "Stop manually sending emails. These five automation workflows will save you hours and increase your open rates by 40%.",
    category: "Marketing",
    tag: "Automation",
    author: { name: "James Park", role: "SEO Specialist" },
    date: "Feb 5, 2026",
    readTime: "5 min read",
    featured: false,
  },
  {
    id: "7",
    title: "Multi-Channel Publishing: One Click, Every Platform",
    excerpt:
      "How Vision's Multi-Channel Sync feature is changing the game for creators who want to grow their audience across platforms.",
    category: "Content",
    tag: "Product",
    author: { name: "Mia Torres", role: "Social Strategist" },
    date: "Jan 30, 2026",
    readTime: "4 min read",
    featured: false,
  },
  {
    id: "8",
    title: "Why Your Landing Page Isn't Converting (And How to Fix It)",
    excerpt:
      "We audited 200+ landing pages and found the same 5 mistakes killing conversion rates. Here's the fix for each one.",
    category: "Marketing",
    tag: "Optimization",
    author: { name: "Alex Kim", role: "Data Analyst" },
    date: "Jan 25, 2026",
    readTime: "9 min read",
    featured: false,
  },
];
