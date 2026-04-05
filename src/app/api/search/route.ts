import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/search";

/**
 * GET /api/search?q=<query>
 *
 * Unified search across wiki articles and IdeaBlocks.
 * Returns JSON array of SearchResult objects sorted by relevance.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  try {
    const results = await searchAll(query);
    return NextResponse.json({ query, results, count: results.length });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
