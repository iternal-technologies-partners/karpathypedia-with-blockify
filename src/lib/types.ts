/**
 * Core TypeScript types for Karpathypedia
 *
 * IdeaBlock — atomic unit of knowledge from the Blockify pipeline
 * WikiArticle — compiled article from grouped IdeaBlocks
 * WikiIndex — master index for navigation and search
 */

// ---------------------------------------------------------------------------
// IdeaBlock types
// ---------------------------------------------------------------------------

export interface Entity {
  name: string;
  type:
    | 'PRODUCT'
    | 'ORGANIZATION'
    | 'PERSON'
    | 'METRIC'
    | 'TECHNOLOGY'
    | 'CONCEPT'
    | 'LOCATION'
    | 'DATE'
    | 'OTHER';
}

/** Atomic unit of knowledge produced by Blockify */
export interface IdeaBlock {
  id: string;
  name: string;
  criticalQuestion: string;
  trustedAnswer: string;
  tags: string[];
  entities: Entity[];
  keywords: string[];
  sourceDocument?: string;
  blockType: 'raw' | 'distilled' | 'merged' | 'synthetic';
  createdAt: string;
  distilled: boolean;
}

// ---------------------------------------------------------------------------
// Wiki article types
// ---------------------------------------------------------------------------

/** Full wiki article compiled from one or more IdeaBlocks */
export interface WikiArticle {
  slug: string;
  title: string;
  summary: string;
  content: string; // markdown body (without frontmatter)
  category: string;
  tags: string[];
  relatedSlugs: string[];
  ideablockIds: string[];
  lastUpdated: string;
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Wiki index types
// ---------------------------------------------------------------------------

/** Lightweight metadata for an article (used in listings & search) */
export interface WikiArticleMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  wordCount: number;
  lastUpdated: string;
}

/** Category metadata for the sidebar / category pages */
export interface CategoryMeta {
  name: string;
  slug: string;
  articleCount: number;
  description: string;
}

/** Master index — serialised as data/index/wiki-index.json */
export interface WikiIndex {
  articles: WikiArticleMeta[];
  categories: CategoryMeta[];
  lastUpdated: string;
  totalArticles: number;
  totalIdeaBlocks: number;
}

// ---------------------------------------------------------------------------
// Search types
// ---------------------------------------------------------------------------

export interface SearchResult {
  type: 'article' | 'ideablock';
  title: string;
  snippet: string;
  slug?: string;
  id?: string;
  score: number;
  category?: string;
  tags?: string[];
}
