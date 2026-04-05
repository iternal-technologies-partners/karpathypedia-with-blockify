import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIdeaBlockById, getAllIdeaBlocks } from "@/lib/ideablocks";
import { getAllArticles } from "@/lib/wiki";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { TagBadge } from "@/components/common/TagBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const block = await getIdeaBlockById(id);
  if (!block) return { title: "IdeaBlock Not Found — Karpathypedia" };
  return {
    title: `${block.name} — IdeaBlock — Karpathypedia`,
    description: block.criticalQuestion,
  };
}

export default async function IdeaBlockDetailPage({ params }: PageProps) {
  const { id } = await params;
  const block = await getIdeaBlockById(id);
  if (!block) notFound();

  // Find articles that reference this block
  const allArticles = await getAllArticles();
  const referencingArticles = allArticles.filter((a) => {
    // Articles store ideablockIds in frontmatter — check wiki-index too
    return false; // will be populated below
  });

  // To find referencing articles, we need to check each article's ideablockIds
  // which are in the index. Let's scan the index.
  const { getWikiIndex } = await import("@/lib/wiki");
  const wikiIndex = await getWikiIndex();

  // We need full article data to check ideablockIds. Read from file system.
  const linkedArticles: { slug: string; title: string }[] = [];
  for (const articleMeta of wikiIndex.articles) {
    const { getArticleBySlug } = await import("@/lib/wiki");
    const article = await getArticleBySlug(articleMeta.slug);
    if (article && article.ideablockIds.includes(block.id)) {
      linkedArticles.push({ slug: article.slug, title: article.title });
    }
  }

  // Find related blocks (same entity or overlapping tags)
  const allBlocks = await getAllIdeaBlocks();
  const relatedBlocks = allBlocks
    .filter((b) => {
      if (b.id === block.id) return false;
      const sharedTags = b.tags.filter((t) => block.tags.includes(t));
      const sharedEntities = b.entities.filter((e) =>
        block.entities.some((be) => be.name === e.name)
      );
      return sharedTags.length >= 2 || sharedEntities.length >= 1;
    })
    .slice(0, 6);

  const blockTypeStyles: Record<string, string> = {
    raw: "bg-amber-50 text-amber-700 border-amber-200",
    distilled: "bg-blue-50 text-blue-700 border-blue-200",
    merged: "bg-green-50 text-green-700 border-green-200",
    synthetic: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="ui-text">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "IdeaBlock Explorer", href: "/ideablocks" },
          { label: block.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-serif font-normal">{block.name}</h1>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${blockTypeStyles[block.blockType] ?? blockTypeStyles.raw}`}
        >
          {block.blockType}
        </span>
      </div>
      <p className="text-xs text-[#72777D] mb-4">
        From Karpathypedia, the LLM knowledge base — IdeaBlock{" "}
        <code className="text-xs bg-wiki-light-bg px-1 py-0.5 rounded">
          {block.id}
        </code>
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Critical Question */}
          <section className="mb-6">
            <h2 className="text-lg font-serif border-b border-wiki-border pb-1 mb-3">
              Critical Question
            </h2>
            <p className="text-[15px] text-[#202122] italic font-medium leading-relaxed">
              {block.criticalQuestion}
            </p>
          </section>

          {/* Trusted Answer */}
          <section className="mb-6">
            <h2 className="text-lg font-serif border-b border-wiki-border pb-1 mb-3">
              Trusted Answer
            </h2>
            <p className="text-[15px] text-[#202122] leading-relaxed">
              {block.trustedAnswer}
            </p>
          </section>

          {/* Keywords */}
          {block.keywords.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-serif border-b border-wiki-border pb-1 mb-3">
                Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {block.keywords.map((kw) => (
                  <Link
                    key={kw}
                    href={`/search?q=${encodeURIComponent(kw)}`}
                    className="inline-block bg-wiki-light-bg border border-wiki-border px-2.5 py-1 rounded text-sm text-[#202122] hover:bg-wiki-tag-bg no-underline"
                  >
                    {kw}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Referenced by Articles */}
          {linkedArticles.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-serif border-b border-wiki-border pb-1 mb-3">
                Referenced by Articles
              </h2>
              <ul className="space-y-1">
                {linkedArticles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/wiki/${a.slug}`}
                      className="text-wiki-link hover:underline text-sm"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related IdeaBlocks */}
          {relatedBlocks.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-serif border-b border-wiki-border pb-1 mb-3">
                Related IdeaBlocks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedBlocks.map((rb) => (
                  <Link
                    key={rb.id}
                    href={`/ideablocks/${rb.id}`}
                    className="block border border-wiki-border rounded p-3 hover:bg-wiki-light-bg no-underline transition-colors"
                  >
                    <span className="text-wiki-link font-medium text-sm block mb-1">
                      {rb.name}
                    </span>
                    <span className="text-xs text-[#54595D] italic line-clamp-2">
                      {rb.criticalQuestion}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Infobox sidebar */}
        <aside className="lg:w-72 shrink-0">
          <div className="border border-wiki-border rounded overflow-hidden">
            <div className="bg-wiki-accent text-white text-sm font-semibold px-4 py-2">
              IdeaBlock Details
            </div>
            <div className="p-4 space-y-3 text-sm">
              {/* Tags */}
              <div>
                <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {block.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>

              {/* Entities */}
              {block.entities.length > 0 && (
                <div>
                  <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                    Entities
                  </span>
                  <ul className="space-y-1">
                    {block.entities.map((e, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-wiki-accent shrink-0" />
                        <span className="text-[#202122]">{e.name}</span>
                        <span className="text-[#A2A9B1]">({e.type})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Block Type */}
              <div>
                <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                  Block Type
                </span>
                <span className="text-xs text-[#202122] capitalize">
                  {block.blockType}
                </span>
              </div>

              {/* Distilled */}
              <div>
                <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                  Distilled
                </span>
                <span className="text-xs text-[#202122]">
                  {block.distilled ? "Yes" : "No"}
                </span>
              </div>

              {/* Source Document */}
              {block.sourceDocument && (
                <div>
                  <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                    Source
                  </span>
                  <span className="text-xs text-[#202122] break-all">
                    {block.sourceDocument}
                  </span>
                </div>
              )}

              {/* Created At */}
              <div>
                <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                  Created
                </span>
                <span className="text-xs text-[#202122]">
                  {new Date(block.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* ID */}
              <div>
                <span className="text-[#54595D] text-xs font-semibold uppercase block mb-1">
                  Block ID
                </span>
                <code className="text-xs text-[#202122] bg-wiki-light-bg px-1.5 py-0.5 rounded break-all">
                  {block.id}
                </code>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
