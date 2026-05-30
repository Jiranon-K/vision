"use client";

import ReactMarkdown from "react-markdown";
import { markdownComponents } from "@/components/markdown/MarkdownComponents";

const PostContent = ({ content }: { content: string }) => (
  <div className="max-w-none">
    <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
  </div>
);

export default PostContent;
