import type { Metadata } from "next";
import { searchAll } from "@/lib/search";
import SearchResults from "@/components/search/SearchResults";
import Breadcrumb from "@/components/common/Breadcrumb";
import type { SearchResult } from "@/lib/types";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  if (q) {
    return {
      title: `Search: ${q} — Karpathypedia`,
      description: `Search results for "${q}"`,
    };
  }
  return {
    title: "Search — Karpathypedia",
    description: "Search the Karpathypedia knowledge base",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let results: SearchResult[] = [];
  if (query) {
    try {
      results = await searchAll(query);
    } catch {
      // Search failed — show empty results
    }
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Search Results" },
  ];

  return (
    <div className="ui-text">
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-2xl font-serif font-normal border-b border-wiki-border pb-2 mb-4">
        Search Results
      </h1>

      {!query ? (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-8 text-center">
          <p className="text-[#54595D] text-sm mb-3">
            Enter a search term to find articles and IdeaBlocks.
          </p>
          <p className="text-xs text-[#72777D]">
            Use the search bar above or navigate using the sidebar.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#54595D] mb-4">
            {results.length === 0
              ? `No results found for "${query}".`
              : `Found ${results.length} ${results.length === 1 ? "result" : "results"} for "${query}".`}
          </p>
          <SearchResults results={results} query={query} />
        </>
      )}
    </div>
  );
}
