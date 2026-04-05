import { NextRequest, NextResponse } from "next/server";
import { getAllArticles, getArticlesByCategory } from "@/lib/wiki";

/**
 * GET /api/articles
 * GET /api/articles?category=<category>
 *
 * Returns all article metadata, optionally filtered by category.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim();

  try {
    const articles = category
      ? await getArticlesByCategory(category)
      : await getAllArticles();

    return NextResponse.json({
      articles,
      count: articles.length,
      ...(category ? { category } : {}),
    });
  } catch (error) {
    console.error("Articles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
