"use client";

import Markdown from "@/shared/markdown/markdown";

const PostContent = ({ content }: { content: string }) => (
  <div className="max-w-none">
    <Markdown content={content} />
  </div>
);

export default PostContent;
