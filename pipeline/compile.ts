/**
 * pipeline/compile.ts — Claude Sonnet article compilation
 *
 * Takes Louvain communities from the graph stage and uses Claude claude-sonnet-4-6
 * to write Wikipedia-style articles for Karpathypedia.
 *
 * Exports:
 *   compile(graphResult, config) → CompileResult
 */

import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import type {
  PipelineConfig,
  GraphResult,
  Community,
  CompileResult,
  CompiledArticle,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert text into a URL-safe slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Escape YAML special characters in a string value.
 * Wraps in double quotes and escapes inner quotes / newlines.
 */
function yamlEscape(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
}

/**
 * Derive a broad category from the dominant entity types in a community.
 */
function deriveCategory(community: Community): string {
  const typeCounts: Record<string, number> = {};

  for (const block of community.blocks) {
    for (const entity of block.entities) {
      const t = entity.type.toUpperCase();
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
  }

  // Find the dominant type
  let maxType = '';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxType = type;
      maxCount = count;
    }
  }

  switch (maxType) {
    case 'TECHNOLOGY':
      return 'Technology';
    case 'CONCEPT':
      return 'Concepts';
    case 'PERSON':
      return 'People';
    case 'PRODUCT':
      return 'Products';
    default:
      return 'General';
  }
}

/**
 * Build the Claude prompt for article generation.
 */
function buildArticlePrompt(community: Community, neighborTopics: string[]): string {
  const category = deriveCategory(community);

  // Build knowledge block sections
  const blockSections = community.blocks
    .map((block) => {
      const lines: string[] = [];
      lines.push(`### ${block.name}`);
      lines.push(`**Q:** ${block.criticalQuestion}`);
      lines.push(`**A:** ${block.trustedAnswer}`);
      if (block.keywords.length > 0) {
        lines.push(`**Keywords:** ${block.keywords.join(', ')}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');

  // Build neighbor topic list with slugs for cross-references
  const neighborLinks = neighborTopics
    .map((topic) => `${topic} (/wiki/${slugify(topic)})`)
    .join(', ');

  return `You are writing an article for Karpathypedia, an LLM-powered knowledge base. Write a comprehensive Wikipedia-style article based ONLY on the verified knowledge blocks provided below. Do not invent facts beyond what the blocks contain.

## Topic: ${community.topic}
## Category: ${category}

## Knowledge Blocks:
${blockSections}

## Connected Topics (for cross-references):
${neighborLinks || 'None'}

## Instructions:
1. Write in encyclopedic, third-person, neutral tone
2. Start with a lead paragraph (no heading) that summarizes the topic in 2-3 sentences
3. Organize into logical sections using ## headings
4. Where relevant, include internal links using [Topic Name](/wiki/topic-slug) format to these connected topics: ${neighborLinks || 'none'}
5. Include a "## See Also" section at the end with links to connected topics
6. Do NOT include a title heading (# Title) — just start with the lead paragraph
7. Aim for 400-800 words
8. Every claim must trace back to one of the knowledge blocks above

Output ONLY the markdown article content. No preamble, no code fences.`;
}

/**
 * Template-based fallback compilation (no LLM).
 * Produces a structured Q&A article from the community's blocks.
 */
function compileArticleTemplate(
  community: Community,
  neighborTopics: string[],
): string {
  const sections: string[] = [];

  // Lead paragraph from first block
  const firstBlock = community.blocks[0];
  const summary = firstBlock.trustedAnswer.slice(0, 300);
  sections.push(`${summary}\n`);

  // Q&A sections
  if (community.blocks.length > 1) {
    sections.push(`## Key Topics\n`);
  }

  for (const block of community.blocks) {
    sections.push(`### ${block.criticalQuestion}\n`);
    sections.push(`${block.trustedAnswer}\n`);
    if (block.keywords.length > 0) {
      sections.push(`**Keywords:** ${block.keywords.join(', ')}\n`);
    }
  }

  // See Also section
  if (neighborTopics.length > 0) {
    sections.push(`## See Also\n`);
    for (const topic of neighborTopics.slice(0, 10)) {
      const slug = slugify(topic);
      sections.push(`- [${topic}](/wiki/${slug})`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// Core compile function
// ---------------------------------------------------------------------------

/**
 * Compile Louvain communities into wiki articles using Claude claude-sonnet-4-6.
 *
 * Falls back to template-based compilation when no API key is provided
 * or when individual Claude calls fail.
 */
export async function compile(
  graphResult: GraphResult,
  config: PipelineConfig,
): Promise<CompileResult> {
  // -------------------------------------------------------------------------
  // Step 1: Filter to article-level communities (level === 1)
  // -------------------------------------------------------------------------

  const level1Communities = graphResult.communities.filter((c) => c.level === 1);
  const level0Orphans = graphResult.communities.filter((c) => c.level === 0);

  // Attach any remaining level-0 orphans to nearest level-1 neighbor
  for (const orphan of level0Orphans) {
    let bestTarget: Community | null = null;

    // Try to find a level-1 neighbor
    for (const neighborId of orphan.neighborCommunityIds) {
      const neighbor = level1Communities.find((c) => c.id === neighborId);
      if (neighbor) {
        bestTarget = neighbor;
        break;
      }
    }

    // If no direct neighbor, attach to the first level-1 community
    if (!bestTarget && level1Communities.length > 0) {
      bestTarget = level1Communities[0];
    }

    if (bestTarget) {
      bestTarget.blocks.push(...orphan.blocks);
      bestTarget.entityNames.push(
        ...orphan.entityNames.filter((e) => !bestTarget!.entityNames.includes(e)),
      );
      console.log(
        `[compile] Merged level-0 orphan community ${orphan.id} ("${orphan.topic}") into community ${bestTarget.id} ("${bestTarget.topic}")`,
      );
    } else {
      // No level-1 communities at all — promote the orphan to article level
      level1Communities.push({ ...orphan, level: 1 });
      console.log(
        `[compile] Promoted level-0 orphan community ${orphan.id} ("${orphan.topic}") to article level`,
      );
    }
  }

  const communities = level1Communities;

  // -------------------------------------------------------------------------
  // Step 2: Determine if we can use Claude
  // -------------------------------------------------------------------------

  const useClaude = Boolean(config.anthropicApiKey);
  let anthropic: Anthropic | null = null;

  if (useClaude) {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    console.log(
      `[compile] Compiling ${communities.length} communities into wiki articles using Claude ${config.claudeModel}`,
    );
  } else {
    console.warn(
      `[compile] WARNING: No ANTHROPIC_API_KEY provided. Falling back to template-based compilation.`,
    );
    console.log(
      `[compile] Compiling ${communities.length} communities into wiki articles using template fallback`,
    );
  }

  // -------------------------------------------------------------------------
  // Step 3: Build a community-id → topic lookup for cross-references
  // -------------------------------------------------------------------------

  const communityById = new Map<number, Community>();
  for (const c of communities) {
    communityById.set(c.id, c);
  }

  // -------------------------------------------------------------------------
  // Step 4: Compile each community into an article
  // NOTE: Articles are processed SEQUENTIALLY to manage Claude rate limits.
  //       Parallelization (e.g., Promise.all with concurrency limiter) is
  //       possible and would improve throughput significantly.
  // -------------------------------------------------------------------------

  const articles: CompiledArticle[] = [];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (const community of communities) {
    // Resolve neighbor topics for cross-references
    const neighborTopics: string[] = [];
    for (const neighborId of community.neighborCommunityIds) {
      const neighbor = communityById.get(neighborId);
      if (neighbor) {
        neighborTopics.push(neighbor.topic);
      }
    }

    let content: string;

    // Attempt Claude compilation, fall back to template on failure
    if (useClaude && anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: config.claudeModel, // 'claude-sonnet-4-6'
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: buildArticlePrompt(community, neighborTopics),
            },
          ],
        });

        // Extract text from response
        const textBlock = response.content.find((block) => block.type === 'text');
        content = textBlock ? textBlock.text : '';

        if (!content) {
          console.warn(
            `[compile] Empty response from Claude for "${community.topic}". Using template fallback.`,
          );
          content = compileArticleTemplate(community, neighborTopics);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(
          `[compile] Claude API error for "${community.topic}": ${errMsg}. Using template fallback.`,
        );
        content = compileArticleTemplate(community, neighborTopics);
      }
    } else {
      content = compileArticleTemplate(community, neighborTopics);
    }

    // Derive article metadata
    const slug = slugify(community.topic);
    const title = community.topic;
    const summary = content.split('\n\n')[0] ?? '';
    const category = deriveCategory(community);
    const tags = collectUniqueTags(community);
    const relatedSlugs = neighborTopics.map((t) => slugify(t));
    const ideablockIds = community.blocks.map((b) => b.id);
    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

    const article: CompiledArticle = {
      slug,
      title,
      summary,
      content,
      category,
      tags,
      relatedSlugs,
      ideablockIds,
      lastUpdated: today,
      wordCount,
      communityId: community.id,
    };

    articles.push(article);
    console.log(
      `[compile] Writing article: "${title}" (${community.blocks.length} blocks, ${wordCount} words)`,
    );
  }

  // -------------------------------------------------------------------------
  // Step 5: Save articles to disk
  // -------------------------------------------------------------------------

  await fs.mkdir(config.wikiDir, { recursive: true });

  for (const article of articles) {
    const frontmatter = buildFrontmatter(article);
    const fileContent = `${frontmatter}\n\n${article.content}`;
    const filePath = path.join(config.wikiDir, `${article.slug}.md`);

    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log(`[compile] Saved: ${filePath}`);
  }

  // -------------------------------------------------------------------------
  // Step 6: Build and save wiki index
  // -------------------------------------------------------------------------

  await fs.mkdir(config.indexDir, { recursive: true });

  const categories = buildCategories(articles);
  const allBlockIds = new Set<string>();
  for (const article of articles) {
    for (const id of article.ideablockIds) {
      allBlockIds.add(id);
    }
  }

  const wikiIndex = {
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      category: a.category,
      tags: a.tags,
      wordCount: a.wordCount,
      lastUpdated: a.lastUpdated,
    })),
    categories,
    lastUpdated: today,
    totalArticles: articles.length,
    totalIdeaBlocks: allBlockIds.size,
  };

  const indexPath = path.join(config.indexDir, 'wiki-index.json');
  await fs.writeFile(indexPath, JSON.stringify(wikiIndex, null, 2), 'utf-8');
  console.log(
    `[compile] Wiki index updated: ${articles.length} articles, ${categories.length} categories`,
  );

  // -------------------------------------------------------------------------
  // Step 7: Save distilled blocks
  // -------------------------------------------------------------------------

  await fs.mkdir(config.ideablocksDir, { recursive: true });

  const allBlocks = communities.flatMap((c) => c.blocks);
  const blocksPath = path.join(config.ideablocksDir, 'blocks.json');
  await fs.writeFile(blocksPath, JSON.stringify(allBlocks, null, 2), 'utf-8');
  console.log(`[compile] Saved ${allBlocks.length} IdeaBlocks to ${blocksPath}`);

  // -------------------------------------------------------------------------
  // Step 8: Return CompileResult
  // -------------------------------------------------------------------------

  return {
    articles,
    categories,
    totalArticles: articles.length,
    totalBlocks: allBlockIds.size,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Collect all unique tags from a community's blocks.
 */
function collectUniqueTags(community: Community): string[] {
  const tagSet = new Set<string>();
  for (const block of community.blocks) {
    for (const tag of block.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet);
}

/**
 * Build YAML frontmatter string for an article.
 */
function buildFrontmatter(article: CompiledArticle): string {
  const lines: string[] = [
    '---',
    `title: ${yamlEscape(article.title)}`,
    `slug: ${yamlEscape(article.slug)}`,
    `summary: ${yamlEscape(article.summary)}`,
    `category: ${yamlEscape(article.category)}`,
    'tags:',
    ...article.tags.map((t) => `  - ${yamlEscape(t)}`),
    'relatedSlugs:',
    ...article.relatedSlugs.map((s) => `  - ${yamlEscape(s)}`),
    'ideablockIds:',
    ...article.ideablockIds.map((id) => `  - ${yamlEscape(id)}`),
    `lastUpdated: ${yamlEscape(article.lastUpdated)}`,
    `wordCount: ${article.wordCount}`,
    '---',
  ];
  return lines.join('\n');
}

/**
 * Build category metadata from the compiled articles.
 */
function buildCategories(
  articles: CompiledArticle[],
): { name: string; slug: string; articleCount: number; description: string }[] {
  const catMap = new Map<string, number>();
  for (const article of articles) {
    catMap.set(article.category, (catMap.get(article.category) ?? 0) + 1);
  }

  return Array.from(catMap.entries()).map(([name, count]) => ({
    name,
    slug: slugify(name),
    articleCount: count,
    description: `Articles about ${name.toLowerCase()}`,
  }));
}
