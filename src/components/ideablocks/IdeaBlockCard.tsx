import Link from "next/link";
import type { IdeaBlock } from "@/lib/types";
import { TagBadge } from "@/components/common/TagBadge";

interface IdeaBlockCardProps {
  block: IdeaBlock;
}

/**
 * Card displaying a single IdeaBlock with name, critical question,
 * trusted answer, tags, entity info, block type, and source.
 */
export function IdeaBlockCard({ block }: IdeaBlockCardProps) {
  return (
    <div className="border border-wiki-border rounded bg-white p-4 hover:shadow-sm transition-shadow flex flex-col">
      {/* Header: name + block type */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-base font-bold text-[#202122] leading-snug flex-1">
          <Link
            href={`/ideablocks/${block.id}`}
            className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
          >
            {block.name}
          </Link>
        </h3>
        <BlockTypeBadge type={block.blockType} />
      </div>

      {/* Critical question */}
      <p className="text-sm text-[#54595D] italic font-medium mb-2 line-clamp-2">
        {block.criticalQuestion}
      </p>

      {/* Trusted answer */}
      <p className="text-sm text-[#202122] mb-3 line-clamp-3 leading-relaxed flex-1">
        {block.trustedAnswer}
      </p>

      {/* Tags */}
      {block.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {block.tags.slice(0, 4).map((tag) => (
            <TagBadge key={tag} tag={tag} size="sm" />
          ))}
          {block.tags.length > 4 && (
            <span className="text-xs text-[#72777D]">
              +{block.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Entity info */}
      {block.entities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {block.entities.slice(0, 3).map((entity, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs text-[#54595D]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-wiki-accent shrink-0" />
              {entity.name}
              <span className="text-[#A2A9B1]">({entity.type})</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer: source document */}
      {block.sourceDocument && (
        <div className="pt-2 border-t border-wiki-border mt-auto">
          <p className="text-xs text-[#72777D] truncate" title={block.sourceDocument}>
            Source: {block.sourceDocument}
          </p>
        </div>
      )}
    </div>
  );
}

function BlockTypeBadge({
  type,
}: {
  type: "raw" | "distilled" | "merged" | "synthetic";
}) {
  const styles: Record<string, string> = {
    raw: "bg-amber-50 text-amber-700 border-amber-200",
    distilled: "bg-blue-50 text-blue-700 border-blue-200",
    merged: "bg-green-50 text-green-700 border-green-200",
    synthetic: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${styles[type] ?? styles.raw}`}
    >
      {type}
    </span>
  );
}

export default IdeaBlockCard;
