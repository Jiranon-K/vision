"use client";

import Markdown from "@/components/markdown/Markdown";

const PostContent = ({ content }: { content: string }) => (
  <div className="max-w-none">
    <Markdown content={content} />
  </div>
);

export default PostContent;
