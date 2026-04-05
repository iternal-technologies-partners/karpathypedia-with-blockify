import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation: Home > Category > Article
 * The last item has no link (current page).
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[#54595D] mb-3">
      <ol className="flex items-center flex-wrap gap-0 list-none m-0 p-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-1.5 text-[#A2A9B1]" aria-hidden="true">
                  &gt;
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[#202122] font-medium" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
