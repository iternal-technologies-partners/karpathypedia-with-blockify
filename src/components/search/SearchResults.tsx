import Link from "next/link";
import type { SearchResult } from "@/lib/types";
import { TagBadge } from "@/components/common/TagBadge";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

/**
 * Displays search results with type badge, title, snippet with
 * highlighted query terms, score indicator, and category/tags.
 */
export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#54595D] text-base">
          No results found for{" "}
          <strong className="text-[#202122]">&ldquo;{query}&rdquo;</strong>
        </p>
        <p className="text-sm text-[#72777D] mt-2">
          Try different keywords or check your spelling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#54595D] mb-4">
        {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
        <strong className="text-[#202122]">&ldquo;{query}&rdquo;</strong>
      </p>

      {results.map((result, index) => (
        <SearchResultItem key={index} result={result} query={query} />
      ))}
    </div>
  );
}

function SearchResultItem({
  result,
  query,
}: {
  result: SearchResult;
  query: string;
}) {
  const href =
    result.type === "article" && result.slug
      ? `/wiki/${result.slug}`
      : result.type === "ideablock" && result.id
        ? `/ideablocks/${result.id}`
        : "#";

  return (
    <div className="border-b border-wiki-border pb-4">
      {/* Type badge + title row */}
      <div className="flex items-center gap-2 mb-1">
        <ResultTypeBadge type={result.type} />
        <h3 className="font-serif text-lg font-bold">
          <Link
            href={href}
            className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
          >
            {result.title}
          </Link>
        </h3>
      </div>

      {/* Snippet with highlighted query */}
      <p className="text-sm text-[#202122] mb-2 leading-relaxed">
        <HighlightedText text={result.snippet} query={query} />
      </p>

      {/* Score + Category + Tags */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <ScoreIndicator score={result.score} />
        {result.category && (
          <TagBadge
            tag={result.category}
            href={`/category/${encodeURIComponent(result.category.toLowerCase().replace(/\s+/g, "-"))}`}
            size="sm"
          />
        )}
        {result.tags?.slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} size="sm" />
        ))}
      </div>
    </div>
  );
}

function ResultTypeBadge({ type }: { type: "article" | "ideablock" }) {
  const isArticle = type === "article";
  return (
    <span
      className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
        isArticle
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-purple-50 text-purple-700 border border-purple-200"
      }`}
    >
      {isArticle ? "Article" : "IdeaBlock"}
    </span>
  );
}

function ScoreIndicator({ score }: { score: number }) {
  // Score from 0 to 1; show as percentage
  const pct = Math.round(score * 100);
  const barColor =
    pct >= 75
      ? "bg-green-500"
      : pct >= 50
        ? "bg-yellow-500"
        : "bg-[#A2A9B1]";

  return (
    <span className="inline-flex items-center gap-1 text-[#72777D]">
      <span className="w-12 h-1.5 bg-[#EAECF0] rounded-full overflow-hidden">
        <span
          className={`block h-full ${barColor} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span>{pct}%</span>
    </span>
  );
}

/**
 * Highlights occurrences of the query within the text.
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-[#202122] px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default SearchResults;
