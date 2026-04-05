import Link from "next/link";
import type { WikiArticle, WikiArticleMeta, IdeaBlock } from "@/lib/types";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { TableOfContents } from "@/components/layout/TableOfContents";
import { TagBadge } from "@/components/common/TagBadge";

interface ArticleViewProps {
  article: WikiArticle;
  relatedArticles?: WikiArticleMeta[];
  headings?: { id: string; text: string; level: number }[];
  sourceBlocks?: IdeaBlock[];
}

/**
 * Main article display component — Wikipedia-style with TOC, markdown content,
 * categories, related articles, and source IdeaBlocks.
 *
 * This is a SERVER component.
 */
export function ArticleView({
  article,
  relatedArticles = [],
  headings = [],
  sourceBlocks = [],
}: ArticleViewProps) {
  const formattedDate = new Date(article.lastUpdated).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="max-w-4xl">
      {/* Title */}
      <h1 className="text-3xl font-serif font-bold text-[#202122] border-b border-wiki-border pb-2 mb-1">
        {article.title}
      </h1>

      {/* Wikipedia-style subtitle */}
      <p className="text-sm text-[#54595D] italic mb-4">
        From Karpathypedia, the LLM knowledge base
      </p>

      {/* Lead / Summary */}
      <p className="text-base leading-relaxed text-[#202122] mb-4 text-[15px]">
        {article.summary}
      </p>

      {/* Table of Contents */}
      {headings.length > 0 && <TableOfContents headings={headings} />}

      {/* Main content */}
      <div className="mt-4">
        <MarkdownRenderer content={article.content} />
      </div>

      {/* Categories */}
      {article.tags.length > 0 && (
        <section className="mt-8 pt-4 border-t border-wiki-border">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm text-[#54595D] font-medium mr-1">
              Categories:
            </span>
            <TagBadge
              tag={article.category}
              href={`/category/${encodeURIComponent(article.category.toLowerCase().replace(/\s+/g, "-"))}`}
              size="sm"
            />
            {article.tags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                size="sm"
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-6 pt-4 border-t border-wiki-border">
          <h2 className="text-xl font-serif font-bold text-[#202122] mb-3">
            Related Articles
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            {relatedArticles.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/wiki/${related.slug}`}
                  className="text-wiki-link hover:text-wiki-link-hover"
                >
                  {related.title}
                </Link>
                {related.summary && (
                  <span className="text-sm text-[#54595D]">
                    {" "}
                    &mdash; {related.summary.slice(0, 100)}
                    {related.summary.length > 100 ? "..." : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Source IdeaBlocks */}
      {article.ideablockIds.length > 0 && (
        <section className="mt-6 pt-4 border-t border-wiki-border">
          <h2 className="text-xl font-serif font-bold text-[#202122] mb-3">
            Source IdeaBlocks
          </h2>
          <p className="text-sm text-[#54595D] mb-2">
            This article was compiled from {article.ideablockIds.length}{" "}
            IdeaBlock{article.ideablockIds.length !== 1 ? "s" : ""}:
          </p>
          {sourceBlocks.length > 0 ? (
            <div className="space-y-2">
              {sourceBlocks.map((block) => (
                <div
                  key={block.id}
                  className="border border-wiki-border rounded bg-wiki-light-bg p-3"
                >
                  <Link
                    href={`/ideablocks/${block.id}`}
                    className="font-medium text-sm text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
                  >
                    {block.name}
                  </Link>
                  <p className="text-xs text-[#54595D] italic mt-1">
                    {block.criticalQuestion}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {article.ideablockIds.map((id) => (
                <Link
                  key={id}
                  href={`/ideablocks/${id}`}
                  className="inline-flex items-center px-2 py-1 text-xs font-mono bg-wiki-light-bg border border-wiki-border rounded text-wiki-link hover:text-wiki-link-hover hover:bg-[#EAECF0] no-underline transition-colors"
                >
                  {id}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Last updated */}
      <div className="mt-6 pt-3 border-t border-wiki-border text-xs text-[#72777D]">
        <p>
          This page was last edited on {formattedDate}. Content compiled from{" "}
          {article.wordCount.toLocaleString()} words of source material.
        </p>
      </div>
    </article>
  );
}

export default ArticleView;
