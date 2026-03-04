export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tag: string;
  author: {
    name: string;
    role: string;
  };
  date: string;
  readTime: string;
  featured: boolean;
}
