import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles, getCategories } from "@/lib/wiki";
import type { WikiArticleMeta } from "@/lib/types";
import { Breadcrumb } from "@/components/common/Breadcrumb";

export const metadata: Metadata = {
  title: "All Articles — Karpathypedia",
  description: "Browse all wiki articles in Karpathypedia",
};

export default async function AllArticlesPage() {
  let articles: WikiArticleMeta[] = [];
  let categories: { name: string; slugs: string[] }[] = [];

  try {
    articles = await getAllArticles();

    // Group by category
    const catMap = new Map<string, WikiArticleMeta[]>();
    for (const a of articles) {
      const cat = a.category || "Uncategorized";
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(a);
    }
    categories = [...catMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, arts]) => ({ name, slugs: arts.map((a) => a.slug) }));
  } catch {
    // Data not ready
  }

  const sortedArticles = [...articles].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="ui-text">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "All Articles" }]} />

      <h1 className="text-2xl font-serif font-normal border-b border-wiki-border pb-2 mb-2">
        All Articles
      </h1>
      <p className="text-sm text-[#54595D] mb-6">
        {articles.length} articles in Karpathypedia
      </p>

      {articles.length === 0 ? (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-8 text-center">
          <p className="text-sm text-[#54595D]">
            No articles yet. Run the pipeline to generate wiki articles from your documents.
          </p>
        </div>
      ) : (
        <>
          {/* Category filter */}
          {categories.length > 1 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-[#202122] mb-2">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map(({ name, slugs }) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 bg-wiki-tag-bg px-2.5 py-1 rounded text-xs text-[#202122]"
                  >
                    {name}
                    <span className="text-[#72777D]">({slugs.length})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Article list */}
          <div className="space-y-3">
            {sortedArticles.map((article) => (
              <div
                key={article.slug}
                className="border border-wiki-border rounded p-4 hover:bg-wiki-light-bg transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/wiki/${article.slug}`}
                    className="text-wiki-link hover:underline font-medium text-[15px]"
                  >
                    {article.title}
                  </Link>
                  <span className="text-xs text-[#72777D] shrink-0">
                    {article.wordCount.toLocaleString()} words
                  </span>
                </div>
                {article.summary && (
                  <p className="text-sm text-[#54595D] mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-[#72777D]">
                  {article.category && <span>{article.category}</span>}
                  {article.tags.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{article.tags.slice(0, 3).join(", ")}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
