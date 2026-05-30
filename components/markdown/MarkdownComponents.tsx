import type { Components } from "react-markdown";

// Shared react-markdown element renderers (brand styling).
// Used by the dashboard editor preview and the public blog article body.
export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-black text-brand-dark mb-4 mt-6 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-brand-dark mb-3 mt-6">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold text-brand-dark mb-2 mt-4">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-brand-dark/80 mb-4 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-brand-dark">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-brand-dark underline hover:text-brand-lime transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-brand-dark/80">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-brand-dark/80">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-brand-dark/80">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-brand-lime pl-4 py-2 my-4 bg-brand-gray/50 rounded-r-lg italic text-brand-dark/70">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-brand-gray px-1.5 py-0.5 rounded text-sm font-mono text-brand-dark border border-brand-dark/20">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-brand-dark text-brand-lime p-4 rounded-lg font-mono text-sm overflow-x-auto my-4">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-brand-dark text-brand-lime p-4 rounded-lg font-mono text-sm overflow-x-auto my-4">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : ""}
      alt={alt || ""}
      className="max-w-full h-auto rounded-lg my-4 border-2 border-brand-dark"
    />
  ),
};
