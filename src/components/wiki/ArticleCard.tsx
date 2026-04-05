import Link from "next/link";
import { TagBadge } from "@/components/common/TagBadge";

interface ArticleCardProps {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  wordCount: number;
  lastUpdated: string;
}

/**
 * Card component for article listings.
 * Shows title, summary, category, tags, and metadata.
 */
export function ArticleCard({
  slug,
  title,
  summary,
  category,
  tags,
  wordCount,
  lastUpdated,
}: ArticleCardProps) {
  const formattedDate = new Date(lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-wiki-border rounded bg-white p-4 hover:shadow-sm transition-shadow">
      {/* Title */}
      <h3 className="font-serif text-lg font-bold mb-1">
        <Link
          href={`/wiki/${slug}`}
          className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
        >
          {title}
        </Link>
      </h3>

      {/* Summary — clamped to 2 lines */}
      <p className="text-sm text-[#202122] mb-3 line-clamp-2 leading-relaxed">
        {summary}
      </p>

      {/* Category + Tags */}
      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <TagBadge
          tag={category}
          href={`/category/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, "-"))}`}
          size="sm"
        />
        {tags.slice(0, 3).map((tag) => (
          <TagBadge key={tag} tag={tag} size="sm" />
        ))}
        {tags.length > 3 && (
          <span className="text-xs text-[#72777D]">+{tags.length - 3}</span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs text-[#72777D]">
        <span>{wordCount.toLocaleString()} words</span>
        <span className="text-[#A2A9B1]" aria-hidden="true">
          |
        </span>
        <span>Updated {formattedDate}</span>
      </div>
    </div>
  );
}

export default ArticleCard;
