# Data Layer Architecture

## Overview

The Karpathypedia data layer consists of three tiers:

1. **IdeaBlocks** — atomic knowledge units produced by the Blockify pipeline
2. **Wiki Articles** — compiled markdown articles with YAML frontmatter
3. **Wiki Index** — a master JSON index for navigation and search

## File Structure

```
data/
  ideablocks/        # IdeaBlock JSON storage
    blocks.json      # Consolidated array of all blocks
    {id}.json        # Individual block files (optional)
  wiki/              # Compiled wiki articles
    {slug}.md        # Markdown with YAML frontmatter
  index/
    wiki-index.json  # Master index
  raw/               # Raw source documents for ingestion
```

## Library Modules

### `/src/lib/types.ts`
Core TypeScript interfaces: `IdeaBlock`, `Entity`, `WikiArticle`, `WikiArticleMeta`, `WikiIndex`, `CategoryMeta`, `SearchResult`.

### `/src/lib/wiki.ts`
Server-side functions for reading wiki articles from disk:
- `getArticleBySlug(slug)` — parse a single .md file with gray-matter
- `getAllArticles()` — reads from index or scans all .md files
- `getArticlesByCategory(category)` — filter by category
- `getCategories()` — list all categories with counts
- `getWikiIndex()` — reads data/index/wiki-index.json
- `getRelatedArticles(slug)` — resolve relatedSlugs references

### `/src/lib/ideablocks.ts`
Server-side functions for reading IdeaBlock JSON data:
- `getAllIdeaBlocks()` — merges blocks.json and individual files
- `getIdeaBlockById(id)` — fast path via {id}.json, fallback to scan
- `getIdeaBlocksByIds(ids)` — batch retrieval preserving order
- `getIdeaBlocksByTag(tag)` — filter by tag (case-insensitive)
- `getIdeaBlocksByEntity(entityName)` — filter by entity name
- `getIdeaBlockStats()` — aggregate statistics

### `/src/lib/search.ts`
Fuse.js-powered fuzzy search:
- `searchWiki(query)` — searches articles by title, summary, tags, category
- `searchIdeaBlocks(query)` — searches blocks by name, question, answer, keywords
- `searchAll(query)` — combined search sorted by relevance score

## Pipeline Scripts

### `pipeline/ingest.ts`
Reads raw documents, chunks them (~2000 chars with overlap), and sends them to the Blockify ingest API. Parses XML responses into IdeaBlock JSON.

Usage: `npx tsx pipeline/ingest.ts <source-dir> [--dry-run]`

Requires: `BLOCKIFY_API_KEY` environment variable.

### `pipeline/compile.ts`
Groups IdeaBlocks by topic/entity and compiles them into wiki articles. Generates markdown with YAML frontmatter and updates the master index.

Usage: `npx tsx pipeline/compile.ts [--dry-run]`

### `pipeline/lint.ts`
Health checks: broken links, orphaned blocks, duplicates, and stats.

Usage: `npx tsx pipeline/lint.ts [--json]`

## Data Flow

```
Raw Documents --> [ingest.ts] --> IdeaBlocks (JSON)
                                       |
                                       v
                               [compile.ts] --> Wiki Articles (MD) + Index (JSON)
                                       |
                                       v
                               [lint.ts] --> Health Report
```

## Graceful Degradation

All library functions handle missing files/directories by returning empty arrays or null. The wiki index falls back to scanning individual files when `wiki-index.json` is absent.
