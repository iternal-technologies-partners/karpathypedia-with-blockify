import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";

/**
 * Wikipedia-style top header with site branding, navigation, and search.
 */
export function Header() {
  return (
    <header className="w-full border-b border-wiki-border bg-white">
      {/* Top bar: branding + search */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo / Branding */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="15" stroke="#3366CC" strokeWidth="2" />
            <circle cx="16" cy="12" r="6" stroke="#3366CC" strokeWidth="1.5" />
            <path
              d="M10 24c0-3.3 2.7-6 6-6s6 2.7 6 6"
              stroke="#3366CC"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="12" r="2" fill="#3366CC" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-serif font-bold text-[#202122]">
              Karpathypedia
            </span>
            <span className="text-xs text-[#54595D] hidden sm:block">
              Blockify Powered Knowledge Base
            </span>
          </div>
        </Link>

        {/* Search bar — centered, prominent */}
        <div className="flex-1 max-w-xl mx-4 hidden sm:block">
          <SearchBar />
        </div>

        {/* Spacer for alignment */}
        <div className="w-32 hidden lg:block" />
      </div>

      {/* Navigation bar */}
      <nav className="border-t border-wiki-border bg-wiki-light-bg">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-0">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/wiki">Articles</NavLink>
          <NavLink href="/ideablocks">IdeaBlocks</NavLink>
          <NavLink href="/categories">Categories</NavLink>
        </div>
      </nav>

      {/* Mobile search — visible on small screens */}
      <div className="px-4 py-2 sm:hidden border-t border-wiki-border">
        <SearchBar />
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm text-[#202122] hover:bg-white hover:text-wiki-link no-underline transition-colors rounded-t-sm"
    >
      {children}
    </Link>
  );
}

export default Header;
