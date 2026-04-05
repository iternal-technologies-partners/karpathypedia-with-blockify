"use client";

import { useState } from "react";
import Link from "next/link";

interface SidebarProps {
  stats: {
    articles: number;
    ideablocks: number;
    categories: number;
  };
  categories: {
    name: string;
    slug: string;
    articleCount: number;
  }[];
}

/**
 * Wikipedia-style left sidebar with navigation, stats, and categories.
 * Collapsible on mobile via a toggle button.
 */
export function Sidebar({ stats, categories }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="w-full lg:w-56 shrink-0">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-2 bg-wiki-sidebar-bg border border-wiki-border rounded text-sm text-[#202122] mb-2"
        aria-expanded={isOpen}
        aria-controls="sidebar-content"
      >
        <span className="font-semibold">Navigation</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Sidebar content */}
      <div
        id="sidebar-content"
        className={`${isOpen ? "block" : "hidden"} lg:block`}
      >
        {/* Navigation section */}
        <SidebarSection title="Navigation">
          <SidebarLink href="/">Main Page</SidebarLink>
          <SidebarLink href="/wiki">All Articles</SidebarLink>
          <SidebarLink href="/categories">All Categories</SidebarLink>
          <SidebarLink href="/wiki/random">Random Article</SidebarLink>
          <SidebarLink href="/ideablocks">IdeaBlock Explorer</SidebarLink>
        </SidebarSection>

        {/* Knowledge Stats section */}
        <SidebarSection title="Knowledge Stats">
          <div className="space-y-1 px-3 py-2 text-sm">
            <StatRow label="Articles" value={stats.articles} />
            <StatRow label="IdeaBlocks" value={stats.ideablocks} />
            <StatRow label="Categories" value={stats.categories} />
          </div>
        </SidebarSection>

        {/* Categories section */}
        {categories.length > 0 && (
          <SidebarSection title="Categories">
            {categories.map((cat) => (
              <SidebarLink key={cat.slug} href={`/category/${cat.slug}`}>
                <span className="flex items-center justify-between w-full">
                  <span>{cat.name}</span>
                  <span className="text-xs text-[#72777D]">
                    ({cat.articleCount})
                  </span>
                </span>
              </SidebarLink>
            ))}
          </SidebarSection>
        )}
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 border border-wiki-border rounded overflow-hidden">
      <div className="bg-wiki-sidebar-bg px-3 py-2 border-b border-wiki-border">
        <h3 className="text-sm font-semibold text-[#202122] font-sans">
          {title}
        </h3>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-1.5 text-sm text-wiki-link hover:bg-wiki-light-bg no-underline hover:underline transition-colors"
    >
      {children}
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#54595D]">{label}</span>
      <span className="font-semibold text-[#202122]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default Sidebar;
