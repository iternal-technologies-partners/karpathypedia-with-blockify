"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
}

/**
 * Client component that renders markdown with Wikipedia-style styling.
 * Uses react-markdown with remark-gfm and rehype-slug.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="wiki-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const markdownComponents: Components = {
  h1: ({ children, id, ...props }) => (
    <h1
      id={id}
      className="text-3xl font-serif font-bold text-[#202122] border-b border-wiki-border pb-1 mt-8 mb-3"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="text-2xl font-serif font-bold text-[#202122] border-b border-wiki-border pb-1 mt-6 mb-2"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3
      id={id}
      className="text-xl font-serif font-bold text-[#202122] mt-5 mb-2"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, id, ...props }) => (
    <h4
      id={id}
      className="text-lg font-serif font-bold text-[#202122] mt-4 mb-1"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-3 leading-relaxed text-[#202122]" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => {
    // Use Next.js Link for internal wiki/ideablock paths
    const isInternal = href && (href.startsWith("/wiki/") || href.startsWith("/ideablocks/") || href.startsWith("/category/") || href.startsWith("/search"));
    if (isInternal) {
      return (
        <Link
          href={href}
          className="text-wiki-link hover:text-wiki-link-hover hover:underline"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-wiki-link hover:text-wiki-link-hover hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  },
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-[#202122] leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-wiki-border bg-wiki-light-bg pl-4 py-2 my-3 text-[#54595D] italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-wiki-light-bg text-[#202122] px-1 py-0.5 rounded text-sm font-mono border border-wiki-border"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`${className ?? ""} text-sm font-mono`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-wiki-light-bg border border-wiki-border rounded p-4 mb-3 overflow-x-auto text-sm leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-3">
      <table
        className="border-collapse border border-wiki-border w-full text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-wiki-light-bg" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-wiki-border px-3 py-2 text-left font-semibold text-[#202122]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-wiki-border px-3 py-2 text-[#202122]" {...props}>
      {children}
    </td>
  ),
  hr: (props) => <hr className="border-wiki-border my-6" {...props} />,
  img: ({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full rounded border border-wiki-border my-3"
      {...props}
    />
  ),
};

export default MarkdownRenderer;
