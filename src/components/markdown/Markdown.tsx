"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { markdownComponents } from "@/components/markdown/MarkdownComponents";

// Single source of truth for markdown rendering — shared by the public article
// body and the dashboard editor preview so the two never drift (same GFM,
// heading anchors, and syntax highlighting in both).
export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, rehypeHighlight]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
