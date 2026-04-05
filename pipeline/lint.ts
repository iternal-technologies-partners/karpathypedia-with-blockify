/**
 * pipeline/lint.ts — Wiki health check script
 *
 * Checks for:
 *  - Broken internal links between articles
 *  - Orphaned IdeaBlocks not referenced by any article
 *  - Duplicate content across articles (by comparing summaries and titles)
 *  - Wiki statistics (articles, words, blocks, categories)
 *
 * Usage:
 *   npx tsx pipeline/lint.ts [--json]
 *
 * Flags:
 *   --json   Output the report as JSON instead of human-readable text
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LintReport {
  timestamp: string;
  stats: WikiStats;
  brokenLinks: BrokenLink[];
  orphanedBlocks: OrphanedBlock[];
  duplicates: DuplicateEntry[];
  warnings: string[];
  healthy: boolean;
}

interface WikiStats {
  totalArticles: number;
  totalIdeaBlocks: number;
  totalWords: number;
  totalCategories: number;
  categories: Record<string, number>;
  averageWordCount: number;
  articlesWithoutBlocks: number;
}

interface BrokenLink {
  sourceArticle: string;
  targetSlug: string;
  linkType: 'relatedSlugs' | 'internalLink';
}

interface OrphanedBlock {
  blockId: string;
  blockName: string;
}

interface DuplicateEntry {
  type: 'title' | 'summary';
  value: string;
  articles: string[];
}

interface ArticleFrontmatter {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  relatedSlugs: string[];
  ideablockIds: string[];
  wordCount?: number;
}

interface IdeaBlock {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIKI_DIR = () => path.join(process.cwd(), 'data', 'wiki');
const BLOCKS_DIR = () => path.join(process.cwd(), 'data', 'ideablocks');
const INTERNAL_LINK_REGEX = /\[([^\]]+)\]\(\/wiki\/([^)]+)\)/g;

// ---------------------------------------------------------------------------
// Utility
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
// Data loading
// ---------------------------------------------------------------------------

async function loadArticles(): Promise<
  Array<{ slug: string; frontmatter: ArticleFrontmatter; content: string }>
> {
  const dir = WIKI_DIR();
  if (!(await pathExists(dir))) return [];

  const entries = await fs.readdir(dir);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));

  const articles: Array<{
    slug: string;
    frontmatter: ArticleFrontmatter;
    content: string;
  }> = [];

  for (const file of mdFiles) {
    const raw = await fs.readFile(path.join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');

    articles.push({
      slug,
      frontmatter: {
        slug: (data.slug as string) ?? slug,
        title: (data.title as string) ?? slug,
        summary: (data.summary as string) ?? '',
        category: (data.category as string) ?? 'Uncategorized',
        tags: Array.isArray(data.tags) ? data.tags : [],
        relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs : [],
        ideablockIds: Array.isArray(data.ideablockIds) ? data.ideablockIds : [],
        wordCount: typeof data.wordCount === 'number' ? data.wordCount : undefined,
      },
      content,
    });
  }

  return articles;
}

async function loadAllBlockIds(): Promise<Map<string, string>> {
  const dir = BLOCKS_DIR();
  if (!(await pathExists(dir))) return new Map();

  const idToName = new Map<string, string>();

  // Consolidated blocks.json
  const consolidatedPath = path.join(dir, 'blocks.json');
  if (await pathExists(consolidatedPath)) {
    const raw = await fs.readFile(consolidatedPath, 'utf-8');
    const blocks: IdeaBlock[] = JSON.parse(raw);
    for (const b of blocks) {
      idToName.set(b.id, b.name);
    }
  }

  // Individual files
  const entries = await fs.readdir(dir);
  for (const file of entries) {
    if (!file.endsWith('.json') || file === 'blocks.json') continue;
    const raw = await fs.readFile(path.join(dir, file), 'utf-8');
    const parsed = JSON.parse(raw);
    const items: IdeaBlock[] = Array.isArray(parsed) ? parsed : [parsed];
    for (const b of items) {
      idToName.set(b.id, b.name);
    }
  }

  return idToName;
}

// ---------------------------------------------------------------------------
// Lint checks
// ---------------------------------------------------------------------------

function checkBrokenLinks(
  articles: Array<{ slug: string; frontmatter: ArticleFrontmatter; content: string }>,
): BrokenLink[] {
  const validSlugs = new Set(articles.map((a) => a.slug));
  const broken: BrokenLink[] = [];

  for (const article of articles) {
    // Check relatedSlugs in frontmatter
    for (const relatedSlug of article.frontmatter.relatedSlugs) {
      if (!validSlugs.has(relatedSlug)) {
        broken.push({
          sourceArticle: article.slug,
          targetSlug: relatedSlug,
          linkType: 'relatedSlugs',
        });
      }
    }

    // Check inline markdown links like [text](/wiki/slug)
    let match: RegExpExecArray | null;
    const regex = new RegExp(INTERNAL_LINK_REGEX.source, 'g');
    while ((match = regex.exec(article.content)) !== null) {
      const targetSlug = match[2];
      if (!validSlugs.has(targetSlug)) {
        broken.push({
          sourceArticle: article.slug,
          targetSlug,
          linkType: 'internalLink',
        });
      }
    }
  }

  return broken;
}

function checkOrphanedBlocks(
  articles: Array<{ slug: string; frontmatter: ArticleFrontmatter }>,
  allBlocks: Map<string, string>,
): OrphanedBlock[] {
  const referencedIds = new Set<string>();

  for (const article of articles) {
    for (const id of article.frontmatter.ideablockIds) {
      referencedIds.add(id);
    }
  }

  const orphaned: OrphanedBlock[] = [];
  for (const [id, name] of allBlocks) {
    if (!referencedIds.has(id)) {
      orphaned.push({ blockId: id, blockName: name });
    }
  }

  return orphaned;
}

function checkDuplicates(
  articles: Array<{ slug: string; frontmatter: ArticleFrontmatter }>,
): DuplicateEntry[] {
  const duplicates: DuplicateEntry[] = [];

  // Check duplicate titles
  const titleMap = new Map<string, string[]>();
  for (const article of articles) {
    const normalizedTitle = article.frontmatter.title.toLowerCase().trim();
    const existing = titleMap.get(normalizedTitle) ?? [];
    existing.push(article.slug);
    titleMap.set(normalizedTitle, existing);
  }

  for (const [title, slugs] of titleMap) {
    if (slugs.length > 1) {
      duplicates.push({ type: 'title', value: title, articles: slugs });
    }
  }

  // Check duplicate summaries (only non-empty ones)
  const summaryMap = new Map<string, string[]>();
  for (const article of articles) {
    const summary = article.frontmatter.summary.toLowerCase().trim();
    if (summary.length < 20) continue; // skip very short / empty summaries
    const existing = summaryMap.get(summary) ?? [];
    existing.push(article.slug);
    summaryMap.set(summary, existing);
  }

  for (const [summary, slugs] of summaryMap) {
    if (slugs.length > 1) {
      duplicates.push({
        type: 'summary',
        value: summary.slice(0, 100) + (summary.length > 100 ? '...' : ''),
        articles: slugs,
      });
    }
  }

  return duplicates;
}

function computeStats(
  articles: Array<{ slug: string; frontmatter: ArticleFrontmatter; content: string }>,
  totalBlocks: number,
): WikiStats {
  const categories: Record<string, number> = {};
  let totalWords = 0;
  let articlesWithoutBlocks = 0;

  for (const article of articles) {
    const cat = article.frontmatter.category;
    categories[cat] = (categories[cat] ?? 0) + 1;

    const wc =
      article.frontmatter.wordCount ??
      article.content.split(/\s+/).filter((w) => w.length > 0).length;
    totalWords += wc;

    if (article.frontmatter.ideablockIds.length === 0) {
      articlesWithoutBlocks += 1;
    }
  }

  return {
    totalArticles: articles.length,
    totalIdeaBlocks: totalBlocks,
    totalWords,
    totalCategories: Object.keys(categories).length,
    categories,
    averageWordCount: articles.length > 0 ? Math.round(totalWords / articles.length) : 0,
    articlesWithoutBlocks,
  };
}

// ---------------------------------------------------------------------------
// Report output
// ---------------------------------------------------------------------------

function printReport(report: LintReport): void {
  console.log('\n========================================');
  console.log('  KARPATHYPEDIA WIKI HEALTH REPORT');
  console.log('========================================\n');

  // Stats
  console.log('--- Statistics ---');
  console.log(`  Articles:         ${report.stats.totalArticles}`);
  console.log(`  IdeaBlocks:       ${report.stats.totalIdeaBlocks}`);
  console.log(`  Total words:      ${report.stats.totalWords.toLocaleString()}`);
  console.log(`  Avg word count:   ${report.stats.averageWordCount}`);
  console.log(`  Categories:       ${report.stats.totalCategories}`);

  if (Object.keys(report.stats.categories).length > 0) {
    for (const [cat, count] of Object.entries(report.stats.categories)) {
      console.log(`    - ${cat}: ${count} article(s)`);
    }
  }

  if (report.stats.articlesWithoutBlocks > 0) {
    console.log(
      `  Articles w/o blocks: ${report.stats.articlesWithoutBlocks}`,
    );
  }

  // Broken links
  console.log('\n--- Broken Links ---');
  if (report.brokenLinks.length === 0) {
    console.log('  None found.');
  } else {
    for (const link of report.brokenLinks) {
      console.log(
        `  [${link.linkType}] ${link.sourceArticle} -> ${link.targetSlug}`,
      );
    }
  }

  // Orphaned blocks
  console.log('\n--- Orphaned IdeaBlocks ---');
  if (report.orphanedBlocks.length === 0) {
    console.log('  None found.');
  } else {
    console.log(`  ${report.orphanedBlocks.length} orphaned block(s):`);
    for (const block of report.orphanedBlocks.slice(0, 20)) {
      console.log(`    - ${block.blockId}: ${block.blockName}`);
    }
    if (report.orphanedBlocks.length > 20) {
      console.log(`    ... and ${report.orphanedBlocks.length - 20} more`);
    }
  }

  // Duplicates
  console.log('\n--- Duplicate Content ---');
  if (report.duplicates.length === 0) {
    console.log('  None found.');
  } else {
    for (const dup of report.duplicates) {
      console.log(
        `  [${dup.type}] "${dup.value}" in: ${dup.articles.join(', ')}`,
      );
    }
  }

  // Warnings
  if (report.warnings.length > 0) {
    console.log('\n--- Warnings ---');
    for (const w of report.warnings) {
      console.log(`  - ${w}`);
    }
  }

  // Overall status
  console.log('\n--- Status ---');
  console.log(
    report.healthy
      ? '  HEALTHY: No issues found.'
      : `  ISSUES FOUND: ${report.brokenLinks.length} broken link(s), ` +
          `${report.orphanedBlocks.length} orphaned block(s), ` +
          `${report.duplicates.length} duplicate(s).`,
  );
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const jsonOutput = process.argv.includes('--json');

  console.log('[lint] Running wiki health check...');

  const articles = await loadArticles();
  const allBlocks = await loadAllBlockIds();

  const brokenLinks = checkBrokenLinks(articles);
  const orphanedBlocks = checkOrphanedBlocks(articles, allBlocks);
  const duplicates = checkDuplicates(articles);
  const stats = computeStats(articles, allBlocks.size);

  const warnings: string[] = [];
  if (stats.totalArticles === 0) {
    warnings.push('No wiki articles found. Run the compile pipeline first.');
  }
  if (stats.totalIdeaBlocks === 0) {
    warnings.push('No IdeaBlocks found. Run the ingest pipeline first.');
  }
  if (stats.articlesWithoutBlocks > 0) {
    warnings.push(
      `${stats.articlesWithoutBlocks} article(s) have no linked IdeaBlocks.`,
    );
  }

  const report: LintReport = {
    timestamp: new Date().toISOString(),
    stats,
    brokenLinks,
    orphanedBlocks,
    duplicates,
    warnings,
    healthy:
      brokenLinks.length === 0 &&
      orphanedBlocks.length === 0 &&
      duplicates.length === 0,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  // Exit with code 1 if there are issues (useful for CI)
  if (!report.healthy) {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error('[lint] Fatal error:', err);
  process.exit(1);
});
