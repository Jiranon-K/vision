import type { BlogPost } from "@/types/types";

const FeaturedCard = ({ post }: { post: BlogPost }) => (
  <article className="featured-card group relative bg-brand-dark rounded-[32px] p-8 md:p-12 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl opacity-0">
    {/* Lime accent bar */}
    <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-lime transition-all duration-500 group-hover:h-2" />

    <div className="flex flex-col gap-6 h-full justify-between">
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-brand-lime text-brand-dark text-sm font-semibold px-4 py-1.5 rounded-full">
            {post.category}
          </span>
          <span className="text-white/50 text-sm">{post.tag}</span>
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4 group-hover:text-brand-lime transition-colors duration-300">
          {post.title}
        </h2>
        <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl">
          {post.excerpt}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          {/* Author avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-brand-lime/20 flex items-center justify-center text-brand-lime font-bold text-sm">
            {post.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{post.author.name}</p>
            <p className="text-white/40 text-xs">{post.author.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white/40 text-sm">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </div>
  </article>
);

export default FeaturedCard;
