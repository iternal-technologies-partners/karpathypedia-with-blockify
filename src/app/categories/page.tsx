import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/wiki";
import type { CategoryMeta } from "@/lib/types";
import { Breadcrumb } from "@/components/common/Breadcrumb";

export const metadata: Metadata = {
  title: "Categories — Karpathypedia",
  description: "Browse all categories in Karpathypedia",
};

export default async function CategoriesPage() {
  let categories: CategoryMeta[] = [];
  try {
    categories = await getCategories();
  } catch {
    // Data not ready
  }

  return (
    <div className="ui-text">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />

      <h1 className="text-2xl font-serif font-normal border-b border-wiki-border pb-2 mb-2">
        All Categories
      </h1>
      <p className="text-sm text-[#54595D] mb-6">
        {categories.length} {categories.length === 1 ? "category" : "categories"} in Karpathypedia
      </p>

      {categories.length === 0 ? (
        <div className="border border-wiki-border rounded bg-wiki-light-bg p-8 text-center">
          <p className="text-sm text-[#54595D]">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="block border border-wiki-border rounded p-4 hover:bg-wiki-light-bg transition-colors no-underline"
            >
              <span className="text-wiki-link font-medium">{cat.name}</span>
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
      )}
    </div>
  );
}
