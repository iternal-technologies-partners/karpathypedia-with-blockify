"use client";

import { useState, useMemo } from "react";
import type { IdeaBlock } from "@/lib/types";
import { IdeaBlockCard } from "@/components/ideablocks/IdeaBlockCard";

interface IdeaBlockGridProps {
  blocks: IdeaBlock[];
}

/**
 * Responsive grid of IdeaBlockCards with optional filtering by tag or entity type.
 */
export function IdeaBlockGrid({ blocks }: IdeaBlockGridProps) {
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterEntityType, setFilterEntityType] = useState<string>("");

  // Collect unique tags and entity types for filter dropdowns
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blocks.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [blocks]);

  const allEntityTypes = useMemo(() => {
    const types = new Set<string>();
    blocks.forEach((b) => b.entities.forEach((e) => types.add(e.type)));
    return Array.from(types).sort();
  }, [blocks]);

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    let result = blocks;
    if (filterTag) {
      result = result.filter((b) => b.tags.includes(filterTag));
    }
    if (filterEntityType) {
      result = result.filter((b) =>
        b.entities.some((e) => e.type === filterEntityType)
      );
    }
    return result;
  }, [blocks, filterTag, filterEntityType]);

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm text-[#54595D] font-medium">Filter by:</span>

        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="text-sm border border-wiki-border rounded px-2 py-1 bg-white text-[#202122] focus:outline-none focus:border-wiki-accent"
          aria-label="Filter by tag"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={filterEntityType}
          onChange={(e) => setFilterEntityType(e.target.value)}
          className="text-sm border border-wiki-border rounded px-2 py-1 bg-white text-[#202122] focus:outline-none focus:border-wiki-accent"
          aria-label="Filter by entity type"
        >
          <option value="">All Entity Types</option>
          {allEntityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {(filterTag || filterEntityType) && (
          <button
            onClick={() => {
              setFilterTag("");
              setFilterEntityType("");
            }}
            className="text-xs text-wiki-link hover:text-wiki-link-hover bg-transparent border-none cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-[#54595D] mb-4">
        Showing {filteredBlocks.length} of {blocks.length} IdeaBlock
        {blocks.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {filteredBlocks.length === 0 ? (
        <p className="text-sm text-[#72777D] italic py-4">
          No IdeaBlocks match the current filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBlocks.map((block) => (
            <IdeaBlockCard key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

export default IdeaBlockGrid;
