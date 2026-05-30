import type { Components } from "react-markdown";

// Shared react-markdown element renderers (brand styling).
// Used by the dashboard editor preview and the public blog article body.
//
// Heading `id`s are injected by rehype-slug (blog article) and forwarded here
// so the table of contents can anchor to them. `scroll-mt-24` keeps the target
// clear of the fixed navbar on anchor jumps.
export const markdownComponents: Components = {
  h1: ({ id, children }) => (
    <h1
      id={id}
      className="text-3xl font-black text-brand-dark mb-4 mt-6 first:mt-0 scroll-mt-24"
    >
      {children}
    </h1>
  ),
  h2: ({ id, children }) => (
    <h2
      id={id}
      className="text-2xl font-bold text-brand-dark mb-3 mt-6 scroll-mt-24"
    >
      {children}
    </h2>
  ),
  h3: ({ id, children }) => (
    <h3
      id={id}
      className="text-xl font-bold text-brand-dark mb-2 mt-4 scroll-mt-24"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-brand-dark/80 mb-4 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-brand-dark">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-brand-dark/50">{children}</del>
  ),
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
  ul: ({ className, children }) => (
    <ul
      className={`list-disc list-inside mb-4 space-y-1 text-brand-dark/80 [&.contains-task-list]:list-none [&_.contains-task-list]:list-none${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-brand-dark/80">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-brand-dark/80">{children}</li>,
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={checked}
        readOnly
        disabled
        className="mr-2 align-middle accent-brand-lime"
      />
    ) : null,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-brand-lime pl-4 py-2 my-4 bg-brand-gray/50 rounded-r-lg italic text-brand-dark/70">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-brand-dark/15">
      <table className="w-full border-collapse text-sm text-brand-dark/80">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-brand-gray text-brand-dark">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-brand-dark/10 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-2 align-top">{children}</td>,
  code: ({ className, children }) => {
    // Inline code: no language class and no embedded newlines.
    const text = typeof children === "string" ? children : "";
    const isBlock = Boolean(className) || text.includes("\n");
    if (!isBlock) {
      return (
        <code className="bg-brand-gray px-1.5 py-0.5 rounded text-sm font-mono text-brand-dark border border-brand-dark/20">
          {children}
        </code>
      );
    }
    // Highlighted block: rehype-highlight set `hljs language-*`; the github-dark
    // theme owns its colors and padding. Language-less blocks get fallback style.
    if (className) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="block p-4 text-brand-lime font-mono text-sm overflow-x-auto">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 rounded-lg overflow-hidden bg-[#0d1117] text-sm">
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
