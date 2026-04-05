/**
 * Wiki article management
 *
 * Reads markdown files with YAML frontmatter from data/wiki/ and the
 * master index from data/index/wiki-index.json.
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type {
  WikiArticle,
  WikiArticleMeta,
  WikiIndex,
  CategoryMeta,
} from './types';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const WIKI_DIR = () => path.join(process.cwd(), 'data', 'wiki');
const INDEX_PATH = () => path.join(process.cwd(), 'data', 'index', 'wiki-index.json');

// ---------------------------------------------------------------------------
// Utility: check if a path exists
// ---------------------------------------------------------------------------

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a single wiki article by slug.
 * Expects the file at data/wiki/{slug}.md with YAML frontmatter.
 */
export async function getArticleBySlug(slug: string): Promise<WikiArticle | null> {
  const filePath = path.join(WIKI_DIR(), `${slug}.md`);

  if (!(await pathExists(filePath))) {
    return null;
  }

  const raw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const wordCount =
    typeof data.wordCount === 'number'
      ? data.wordCount
      : content
          .split(/\s+/)
          .filter((w: string) => w.length > 0).length;

  return {
    slug: (data.slug as string) ?? slug,
    title: (data.title as string) ?? slug,
    summary: (data.summary as string) ?? '',
    content,
    category: (data.category as string) ?? 'Uncategorized',
    tags: Array.isArray(data.tags) ? data.tags : [],
    relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs : [],
    ideablockIds: Array.isArray(data.ideablockIds) ? data.ideablockIds : [],
    lastUpdated: (data.lastUpdated as string) ?? new Date().toISOString(),
    wordCount,
  };
}

/**
 * Return lightweight metadata for every article in the wiki.
 *
 * Prefers reading the pre-built index (data/index/wiki-index.json) for speed.
 * Falls back to scanning all .md files in data/wiki/ when the index is absent.
 */
export async function getAllArticles(): Promise<WikiArticleMeta[]> {
  // Fast path: use the pre-built index
  const index = await getWikiIndex();
  if (index.articles.length > 0) {
    return index.articles;
  }

  // Slow path: scan individual files
  const wikiDir = WIKI_DIR();
  if (!(await pathExists(wikiDir))) {
    return [];
  }

  const entries = await fs.readdir(wikiDir);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  const articles: WikiArticleMeta[] = [];

  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, '');
    const article = await getArticleBySlug(slug);
    if (article) {
      articles.push({
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        wordCount: article.wordCount,
        lastUpdated: article.lastUpdated,
      });
    }
  }

  return articles;
}

/**
 * Return articles belonging to a specific category.
 */
export async function getArticlesByCategory(
  category: string,
): Promise<WikiArticleMeta[]> {
  const all = await getAllArticles();
  return all.filter(
    (a) => a.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Return all categories with counts.
 *
 * Uses the index first; falls back to deriving categories from all articles.
 */
export async function getCategories(): Promise<CategoryMeta[]> {
  const index = await getWikiIndex();
  if (index.categories.length > 0) {
    return index.categories;
  }

  // Derive from articles
  const articles = await getAllArticles();
  const catMap = new Map<string, { count: number }>();

  for (const a of articles) {
    const existing = catMap.get(a.category);
    if (existing) {
      existing.count += 1;
    } else {
      catMap.set(a.category, { count: 1 });
    }
  }

  return Array.from(catMap.entries()).map(([name, { count }]) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    articleCount: count,
    description: '',
  }));
}

/**
 * Read the master wiki index from data/index/wiki-index.json.
 * Returns an empty index when the file is missing.
 */
export async function getWikiIndex(): Promise<WikiIndex> {
  const indexPath = INDEX_PATH();

  if (!(await pathExists(indexPath))) {
    return {
      articles: [],
      categories: [],
      lastUpdated: new Date().toISOString(),
      totalArticles: 0,
      totalIdeaBlocks: 0,
    };
  }

  const raw = await fs.readFile(indexPath, 'utf-8');
  return JSON.parse(raw) as WikiIndex;
}

/**
 * Get related articles for a given slug.
 *
 * Reads the article's relatedSlugs list and resolves each to metadata.
 */
export async function getRelatedArticles(
  slug: string,
): Promise<WikiArticleMeta[]> {
  const article = await getArticleBySlug(slug);
  if (!article || article.relatedSlugs.length === 0) {
    return [];
  }

  const allArticles = await getAllArticles();
  const slugSet = new Set(article.relatedSlugs);

  return allArticles.filter((a) => slugSet.has(a.slug));
}
