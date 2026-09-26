import type { PostCreator } from "@/features/posts";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
  author: PostCreator;
  date: string;
  readTime: string;
  featured: boolean;
}
