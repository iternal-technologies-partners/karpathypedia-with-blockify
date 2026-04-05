import Link from "next/link";

interface TagBadgeProps {
  tag: string;
  href?: string;
  size?: "sm" | "md";
}

/**
 * Reusable tag badge with category-specific colors.
 * Links to search or category page when href is provided.
 */

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TECHNOLOGY: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CONCEPT: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  PERSON: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  ORGANIZATION: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  PRODUCT: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  METRIC: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  LOCATION: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  DATE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  AI: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  ML: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  RESEARCH: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

const DEFAULT_COLORS = {
  bg: "bg-[#EAECF0]",
  text: "text-[#202122]",
  border: "border-[#C8CCD1]",
};

function getTagColors(tag: string) {
  const upper = tag.toUpperCase();
  return TAG_COLORS[upper] ?? DEFAULT_COLORS;
}

export function TagBadge({ tag, href, size = "sm" }: TagBadgeProps) {
  const colors = getTagColors(tag);
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";

  const className = `inline-flex items-center rounded border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} font-medium no-underline hover:opacity-80 transition-opacity`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {tag}
      </Link>
    );
  }

  return <span className={className}>{tag}</span>;
}

export default TagBadge;
