import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticlesByCategory, getCategories } from "@/lib/wiki";
import Breadcrumb from "@/components/common/Breadcrumb";
import type { WikiArticleMeta, CategoryMeta } from "@/lib/types";

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: `${decodedName} — Karpathypedia`,
    description: `Browse articles in the ${decodedName} category`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  let articles: WikiArticleMeta[] = [];
  let categoryMeta: CategoryMeta | undefined;

  try {
    const [fetchedArticles, categories] = await Promise.all([
      getArticlesByCategory(decodedName),
      getCategories(),
    ]);

    articles = fetchedArticles;

    // Find category metadata — match by slug or name (case-insensitive)
    categoryMeta = categories.find(
      (c) =>
        c.slug === decodedName.toLowerCase().replace(/\s+/g, "-") ||
        c.name.toLowerCase() === decodedName.toLowerCase()
    );
  } catch {
    // Data layer error — continue with empty
  }

  // If no category found and no articles, show 404
  if (!categoryMeta && articles.length === 0) {
    notFound();
  }

  const displayName = categoryMeta?.name ?? decodedName;
  const description = categoryMeta?.description ?? "";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/" },
    { label: displayName },
  ];

  return (
    <div className="ui-text">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-2xl font-serif font-normal border-b border-wiki-border pb-2 mb-2">
        Category: {displayName}
      </h1>

      {description && (
        <p className="text-sm text-[#54595D] mb-4">{description}</p>
      )}

      <p className="text-sm text-[#72777D] mb-6">
        {articles.length} {articles.length === 1 ? "article" : "articles"} in
        this category
      </p>

      {articles.length === 0 ? (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-6 text-center">
          <p className="text-sm text-[#54595D]">
            No articles in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.slug}
              className="border border-wiki-border rounded p-4 hover:bg-wiki-light-bg transition-colors"
            >
              <Link
                href={`/wiki/${article.slug}`}
                className="text-wiki-link font-medium text-[15px] hover:underline"
              >
                {article.title}
              </Link>
              <p className="text-sm text-[#54595D] mt-1 line-clamp-2">
                {article.summary}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#72777D]">
                <span>{article.wordCount.toLocaleString()} words</span>
                {article.tags.length > 0 && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span className="flex gap-1 flex-wrap">
                      {article.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block bg-wiki-tag-bg px-1.5 py-0.5 rounded text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
