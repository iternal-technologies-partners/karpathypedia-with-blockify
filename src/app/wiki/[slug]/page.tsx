import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/wiki";
import ArticleView from "@/components/wiki/ArticleView";
import Breadcrumb from "@/components/common/Breadcrumb";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found — Karpathypedia" };
  }

  return {
    title: `${article.title} — Karpathypedia`,
    description: article.summary,
  };
}

/**
 * Extract headings from markdown content for the table of contents.
 */
function extractHeadings(
  content: string
): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(slug);
  const headings = extractHeadings(article.content);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: article.category,
      href: `/category/${article.category.toLowerCase().replace(/\s+/g, "-")}`,
    },
    { label: article.title },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      <ArticleView
        article={article}
        relatedArticles={relatedArticles}
        headings={headings}
      />
    </div>
  );
}
