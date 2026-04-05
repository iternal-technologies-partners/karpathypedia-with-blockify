import { NextRequest, NextResponse } from "next/server";
import {
  getAllIdeaBlocks,
  getIdeaBlockById,
  getIdeaBlocksByTag,
} from "@/lib/ideablocks";

/**
 * GET /api/ideablocks
 * GET /api/ideablocks?id=<id>
 * GET /api/ideablocks?tag=<tag>
 *
 * Returns IdeaBlocks — all, by ID, or filtered by tag.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const tag = searchParams.get("tag")?.trim();

  try {
    // Single block by ID
    if (id) {
      const block = await getIdeaBlockById(id);
      if (!block) {
        return NextResponse.json(
          { error: `IdeaBlock not found: ${id}` },
          { status: 404 }
        );
      }
      return NextResponse.json({ block });
    }

    // Filter by tag
    if (tag) {
      const blocks = await getIdeaBlocksByTag(tag);
      return NextResponse.json({ blocks, count: blocks.length, tag });
    }

    // All blocks
    const blocks = await getAllIdeaBlocks();
    return NextResponse.json({ blocks, count: blocks.length });
  } catch (error) {
    console.error("IdeaBlocks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch IdeaBlocks" },
      { status: 500 }
    );
  }
}
