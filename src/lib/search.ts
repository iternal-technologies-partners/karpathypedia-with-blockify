/**
 * Search functionality using Fuse.js for client-side fuzzy search.
 *
 * Provides unified search across wiki articles and IdeaBlocks.
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { SearchResult, WikiArticleMeta, IdeaBlock } from './types';
import { getAllArticles } from './wiki';
import { getAllIdeaBlocks } from './ideablocks';

// ---------------------------------------------------------------------------
// Fuse.js configuration
// ---------------------------------------------------------------------------

const ARTICLE_FUSE_OPTIONS: IFuseOptions<WikiArticleMeta> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'summary', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const BLOCK_FUSE_OPTIONS: IFuseOptions<IdeaBlock> = {
  keys: [
    { name: 'name', weight: 0.3 },
    { name: 'criticalQuestion', weight: 0.25 },
    { name: 'trustedAnswer', weight: 0.25 },
    { name: 'keywords', weight: 0.1 },
    { name: 'tags', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ---------------------------------------------------------------------------
// Search functions
// ---------------------------------------------------------------------------

/**
 * Search wiki articles by title, summary, tags, and category.
 */
export async function searchWiki(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const articles = await getAllArticles();
  if (articles.length === 0) return [];

  const fuse = new Fuse(articles, ARTICLE_FUSE_OPTIONS);
  const results = fuse.search(query);

  return results.map((r) => ({
    type: 'article' as const,
    title: r.item.title,
    snippet: r.item.summary,
    slug: r.item.slug,
    score: r.score !== undefined ? 1 - r.score : 0,
    category: r.item.category,
    tags: r.item.tags,
  }));
}

/**
 * Search IdeaBlocks by name, criticalQuestion, trustedAnswer, and keywords.
 */
export async function searchIdeaBlocks(
  query: string,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const blocks = await getAllIdeaBlocks();
  if (blocks.length === 0) return [];

  const fuse = new Fuse(blocks, BLOCK_FUSE_OPTIONS);
  const results = fuse.search(query);

  return results.map((r) => ({
    type: 'ideablock' as const,
    title: r.item.name,
    snippet: r.item.trustedAnswer.slice(0, 200),
    id: r.item.id,
    score: r.score !== undefined ? 1 - r.score : 0,
    tags: r.item.tags,
  }));
}

/**
 * Unified search across articles and IdeaBlocks, sorted by relevance.
 */
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [articleResults, blockResults] = await Promise.all([
    searchWiki(query),
    searchIdeaBlocks(query),
  ]);

  const combined = [...articleResults, ...blockResults];

  // Sort descending by score (higher = better match)
  combined.sort((a, b) => b.score - a.score);

  return combined;
}
