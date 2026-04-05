import type { Metadata } from "next";
import { getAllIdeaBlocks, getIdeaBlockStats } from "@/lib/ideablocks";
import IdeaBlockGrid from "@/components/ideablocks/IdeaBlockGrid";
import Breadcrumb from "@/components/common/Breadcrumb";
import type { IdeaBlock } from "@/lib/types";

export const metadata: Metadata = {
  title: "IdeaBlock Explorer — Karpathypedia",
  description: "Browse the atomic knowledge units that power the Karpathypedia wiki",
};

export default async function IdeaBlocksPage() {
  let blocks: IdeaBlock[] = [];
  let stats = { total: 0, raw: 0, distilled: 0, tags: {} as Record<string, number> };

  try {
    [blocks, stats] = await Promise.all([
      getAllIdeaBlocks(),
      getIdeaBlockStats(),
    ]);
  } catch {
    // Data not ready — render empty state
  }

  const topTags = Object.entries(stats.tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "IdeaBlock Explorer" },
  ];

  return (
    <div className="ui-text">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-2xl font-serif font-normal border-b border-wiki-border pb-2 mb-2">
        IdeaBlock Explorer
      </h1>
      <p className="text-sm text-[#54595D] mb-6">
        Browse the atomic knowledge units that power this wiki.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBadge label="Total Blocks" value={stats.total} />
        <StatBadge label="Raw" value={stats.raw} />
        <StatBadge label="Distilled" value={stats.distilled} />
        <StatBadge label="Unique Tags" value={Object.keys(stats.tags).length} />
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#202122] mb-2">Top Tags</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-wiki-tag-bg px-2.5 py-1 rounded text-xs text-[#202122]"
              >
                {tag}
                <span className="text-[#72777D]">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* IdeaBlock grid */}
      {blocks.length === 0 ? (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-8 text-center">
          <p className="text-sm text-[#54595D]">
            No IdeaBlocks yet. Start by processing documents through the Blockify pipeline.
          </p>
        </div>
      ) : (
        <IdeaBlockGrid blocks={blocks} />
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-wiki-border rounded p-3 text-center bg-white">
      <div className="text-xl font-bold text-wiki-accent">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-[#54595D] mt-0.5">{label}</div>
    </div>
  );
}
