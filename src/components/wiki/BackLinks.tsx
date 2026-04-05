import Link from "next/link";

interface BackLinksProps {
  backlinks: { slug: string; title: string }[];
}

/**
 * Shows which other articles link to the current one.
 * Wikipedia-style "What links here" section.
 */
export function BackLinks({ backlinks }: BackLinksProps) {
  if (backlinks.length === 0) return null;

  return (
    <section className="border border-wiki-border rounded bg-wiki-light-bg p-4 mt-6">
      <h3 className="font-serif text-base font-bold text-[#202122] mb-2">
        What links here
      </h3>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        {backlinks.map((link) => (
          <li key={link.slug}>
            <Link
              href={`/wiki/${link.slug}`}
              className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BackLinks;
