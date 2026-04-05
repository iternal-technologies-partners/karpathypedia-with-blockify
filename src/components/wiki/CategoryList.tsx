import Link from "next/link";
import type { CategoryMeta } from "@/lib/types";

interface CategoryListProps {
  categories: CategoryMeta[];
}

/**
 * Displays categories in a responsive grid.
 * Each card shows name, article count, description, and links to category page.
 */
export function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#54595D] italic">No categories found.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="block border border-wiki-border rounded bg-white p-4 hover:shadow-sm hover:border-wiki-accent transition-all no-underline group"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-serif text-lg font-bold text-[#202122] group-hover:text-wiki-link transition-colors">
              {cat.name}
            </h3>
            <span className="shrink-0 ml-2 inline-flex items-center justify-center bg-wiki-light-bg border border-wiki-border rounded-full px-2 py-0.5 text-xs font-medium text-[#54595D]">
              {cat.articleCount} article{cat.articleCount !== 1 ? "s" : ""}
            </span>
          </div>

          {cat.description && (
            <p className="text-sm text-[#54595D] line-clamp-2 leading-relaxed">
              {cat.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export default CategoryList;
