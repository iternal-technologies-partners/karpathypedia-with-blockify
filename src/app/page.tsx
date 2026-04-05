import Link from "next/link";
import { getAllArticles, getCategories } from "@/lib/wiki";
import { getIdeaBlockStats } from "@/lib/ideablocks";
import type { WikiArticleMeta, CategoryMeta } from "@/lib/types";

export default async function HomePage() {
  let articles: WikiArticleMeta[] = [];
  let categories: CategoryMeta[] = [];
  let blockStats = { total: 0, raw: 0, distilled: 0, tags: {} as Record<string, number> };

  try {
    [articles, categories, blockStats] = await Promise.all([
      getAllArticles(),
      getCategories(),
      getIdeaBlockStats(),
    ]);
  } catch {
    // Data not available yet — render empty state
  }

  const totalWords = articles.reduce((sum, a) => sum + a.wordCount, 0);
  const featuredArticles = articles.slice(0, 6);
  const recentArticles = [...articles]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  const isEmpty = articles.length === 0 && blockStats.total === 0;

  return (
    <div className="ui-text">
      {/* Welcome heading */}
      <h1 className="text-3xl font-serif font-normal border-b border-wiki-border pb-2 mb-4">
        Welcome to Karpathypedia
      </h1>

      <p className="text-[15px] text-[#54595D] mb-6 leading-relaxed">
        An LLM-powered knowledge base built on Blockify IdeaBlocks. Raw knowledge
        is processed into atomic IdeaBlocks, then compiled into interconnected wiki
        articles. Get a free trial of Blockify here:{" "}
        <a href="https://console.blockify.ai/signup" target="_blank" rel="noopener noreferrer" className="text-wiki-link hover:underline">
          console.blockify.ai/signup
        </a>. Get access to the Blockify skill here:{" "}
        <a href="https://github.com/iternal-technologies-partners/blockify-agentic-data-optimization" target="_blank" rel="noopener noreferrer" className="text-wiki-link hover:underline">
          blockify-agentic-data-optimization
        </a>
      </p>

      {/* Empty state */}
      {isEmpty && (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-6 text-center mb-8">
          <p className="text-[#54595D] text-sm">
            No articles yet. Start by ingesting raw documents through the Blockify pipeline.
          </p>
        </div>
      )}

      {/* How It Works pipeline */}
      <section className="mb-8">
        <h2 className="text-xl font-serif border-b border-wiki-border pb-1 mb-4">
          How It Works
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-0">
          <PipelineStep
            step="1"
            title="Ingest"
            description="Raw documents, transcripts, and sources are fed into the pipeline"
          />
          <PipelineArrow />
          <PipelineStep
            step="2"
            title="Blockify"
            description="Content is broken into atomic IdeaBlocks with Q&A pairs"
          />
          <PipelineArrow />
          <PipelineStep
            step="3"
            title="Compile"
            description="IdeaBlocks are grouped, merged, and compiled into wiki articles"
          />
          <PipelineArrow />
          <PipelineStep
            step="4"
            title="Explore"
            description="Browse interconnected articles with full-text search"
          />
        </div>
      </section>

      {/* Knowledge Stats */}
      <section className="mb-8">
        <h2 className="text-xl font-serif border-b border-wiki-border pb-1 mb-4">
          Knowledge Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Articles" value={articles.length} />
          <StatCard label="IdeaBlocks" value={blockStats.total} />
          <StatCard label="Categories" value={categories.length} />
          <StatCard label="Total Words" value={totalWords} />
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-serif border-b border-wiki-border pb-1 mb-4">
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <ArticleCardCompact key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Changes */}
      {recentArticles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-serif border-b border-wiki-border pb-1 mb-4">
            Recent Changes
          </h2>
          <ul className="space-y-2">
            {recentArticles.map((article) => (
              <li key={article.slug} className="flex items-baseline gap-2 text-sm">
                <span className="text-[#72777D] shrink-0 w-24">
                  {new Date(article.lastUpdated).toLocaleDateString()}
                </span>
                <Link
                  href={`/wiki/${article.slug}`}
                  className="text-wiki-link hover:underline"
                >
                  {article.title}
                </Link>
                <span className="text-[#72777D]">
                  ({article.wordCount.toLocaleString()} words)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Browse Categories */}
      {categories.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-serif border-b border-wiki-border pb-1 mb-4">
            Browse Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="block border border-wiki-border rounded p-3 hover:bg-wiki-light-bg transition-colors no-underline"
              >
                <span className="text-wiki-link font-medium text-sm">
                  {cat.name}
                </span>
                <span className="block text-xs text-[#72777D] mt-1">
                  {cat.articleCount} {cat.articleCount === 1 ? "article" : "articles"}
                </span>
                {cat.description && (
                  <span className="block text-xs text-[#54595D] mt-1 line-clamp-2">
                    {cat.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ----- Sub-components ----- */

function PipelineStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 border border-wiki-border rounded p-4 bg-white text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-wiki-accent text-white text-sm font-bold mb-2">
        {step}
      </div>
      <h3 className="font-semibold text-sm text-[#202122] mb-1">{title}</h3>
      <p className="text-xs text-[#54595D] leading-relaxed">{description}</p>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex items-center justify-center sm:px-1 py-2 sm:py-0">
      {/* Horizontal arrow for sm+ */}
      <svg
        className="hidden sm:block w-6 h-6 text-wiki-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      {/* Vertical arrow for mobile */}
      <svg
        className="sm:hidden w-6 h-6 text-wiki-accent"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-wiki-border rounded p-4 text-center bg-white">
      <div className="text-2xl font-bold text-wiki-accent">{value.toLocaleString()}</div>
      <div className="text-sm text-[#54595D] mt-1">{label}</div>
    </div>
  );
}

function ArticleCardCompact({ article }: { article: WikiArticleMeta }) {
  return (
    <Link
      href={`/wiki/${article.slug}`}
      className="block border border-wiki-border rounded p-4 hover:bg-wiki-light-bg transition-colors no-underline"
    >
      <h3 className="text-wiki-link font-medium text-sm mb-1">{article.title}</h3>
      <p className="text-xs text-[#54595D] line-clamp-3 mb-2">{article.summary}</p>
      <div className="flex items-center gap-2 text-xs text-[#72777D]">
        <span>{article.category}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{article.wordCount.toLocaleString()} words</span>
      </div>
    </Link>
  );
}
