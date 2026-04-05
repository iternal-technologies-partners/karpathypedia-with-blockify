"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
}

/**
 * Client component: search input with icon that navigates to /search?q=query.
 */
export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search Karpathypedia
      </label>
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72777D] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Karpathypedia"
          className="w-full pl-9 pr-20 py-2 text-sm border border-wiki-border rounded bg-white text-[#202122] placeholder-[#72777D] focus:outline-none focus:border-wiki-accent focus:ring-1 focus:ring-wiki-accent"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium bg-wiki-light-bg border border-wiki-border rounded hover:bg-[#EAECF0] text-[#202122] transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
