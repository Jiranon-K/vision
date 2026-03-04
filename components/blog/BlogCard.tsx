import type { BlogPost } from "@/types/types";
import ArrowIcon from "./ArrowIcon";

const BlogCard = ({ post }: { post: BlogPost }) => (
  <article className="blog-card group bg-white rounded-[28px] border-2 border-brand-dark/10 p-7 cursor-pointer transition-all duration-400 hover:border-brand-lime hover:-translate-y-2 hover:shadow-[0px_8px_24px_rgba(185,255,102,0.15)] opacity-0">
    <div className="flex flex-col gap-5 h-full justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-brand-gray text-brand-dark text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-300 group-hover:bg-brand-lime">
            {post.category}
          </span>
          <span className="text-brand-dark/40 text-xs">{post.tag}</span>
        </div>

        <h3 className="text-xl font-bold text-brand-dark leading-snug mb-3 group-hover:text-brand-dark transition-colors duration-300">
          {post.title}
        </h3>
        <p className="text-brand-dark/50 text-sm leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-brand-dark/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center text-brand-lime font-bold text-xs">
            {post.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-brand-dark text-sm font-medium">
              {post.author.name}
            </p>
            <p className="text-brand-dark/40 text-xs">{post.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-brand-dark/50 group-hover:text-brand-lime transition-colors duration-300">
          <span className="text-sm font-medium">{post.readTime}</span>
          <ArrowIcon />
        </div>
      </div>
    </div>
  </article>
);

export default BlogCard;
