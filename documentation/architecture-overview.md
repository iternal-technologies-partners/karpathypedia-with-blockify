# Architecture Overview — Karpathypedia with Blockify

## System Purpose

Karpathypedia is an LLM-powered knowledge base with a Wikipedia-style UI, built on Blockify IdeaBlocks. It transforms raw documents into structured, atomic Q&A units (IdeaBlocks) and compiles them into interconnected wiki articles. The key architectural insight is **pre-processing information into atomic knowledge units before LLM-based article generation**, producing more accurate, traceable, and maintainable content than raw LLM compilation.

## Data Flow Pipeline

```
Raw Documents
      │
      ▼
┌─────────────────┐
│  Blockify Ingest │  ── Parse, chunk, and extract Q&A pairs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IdeaBlocks     │  ── Atomic Q&A units with metadata
│   (raw blocks)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Distillation    │  ── LLM refines and validates blocks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IdeaBlocks      │  ── Verified, enriched knowledge atoms
│  (distilled)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Wiki Compilation │  ── LLM assembles blocks into articles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wiki Articles   │  ── Markdown with frontmatter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js UI      │  ── Wikipedia-style browsing experience
└─────────────────┘
```

## Component Architecture

### Data Layer (`/src/lib/`)

| Component | File | Responsibility |
|-----------|------|----------------|
| IdeaBlock Types | `types.ts` | TypeScript interfaces for IdeaBlock, WikiArticle, SearchResult |
| Data Loader | `data.ts` | Load and parse JSON blocks and markdown articles |
| Search Engine | `search.ts` | Fuse.js-based full-text search across articles and blocks |
| Article Manager | `articles.ts` | CRUD operations, slug resolution, category filtering |
| Block Manager | `blocks.ts` | IdeaBlock querying, filtering by tag/type/entity |

### UI Components (`/src/components/`)

| Component | Purpose |
|-----------|---------|
| `layout/WikiLayout` | Main Wikipedia-style page shell with sidebar navigation |
| `layout/Header` | Top navigation bar with search and branding |
| `layout/Sidebar` | Category navigation and table of contents |
| `layout/Footer` | Site footer with metadata |
| `article/ArticleView` | Full article renderer with heading anchors |
| `article/ArticleCard` | Summary card for article listings |
| `article/TableOfContents` | Auto-generated TOC from headings |
| `article/RelatedArticles` | Links to related wiki articles |
| `blocks/IdeaBlockCard` | Display card for a single IdeaBlock |
| `blocks/IdeaBlockExplorer` | Browse and filter IdeaBlocks |
| `blocks/BlockDetail` | Full detail view of an IdeaBlock |
| `search/SearchBar` | Global search input component |
| `search/SearchResults` | Rendered list of search results |
| `common/TagBadge` | Reusable tag display component |
| `common/CategoryBadge` | Category label component |

### Pages (`/src/app/`)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Featured articles, categories, stats |
| `/wiki/[slug]` | Article | Individual wiki article view |
| `/categories` | Categories | Browse articles by category |
| `/categories/[slug]` | Category | Articles within a specific category |
| `/explore` | IdeaBlock Explorer | Browse all IdeaBlocks |
| `/search` | Search Results | Full-text search page |

### API Routes (`/src/app/api/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Full-text search with query parameter |
| `/api/articles` | GET | List articles with optional category filter |
| `/api/articles/[slug]` | GET | Get single article by slug |
| `/api/blocks` | GET | List IdeaBlocks with optional filters |
| `/api/blocks/[id]` | GET | Get single IdeaBlock by ID |

### Pipeline Scripts (`/pipeline/`)

| Script | Purpose |
|--------|---------|
| `ingest.ts` | Parse raw documents into raw IdeaBlocks |
| `compile.ts` | Assemble IdeaBlocks into wiki articles |
| `lint.ts` | Validate blocks and articles for consistency |

## Directory Structure

```
karpathypedia-with-blockify/
├── data/
│   ├── ideablocks/
│   │   └── blocks.json          # All IdeaBlocks
│   ├── wiki/
│   │   ├── transformer-architecture.md
│   │   ├── large-language-models.md
│   │   ├── neural-network-fundamentals.md
│   │   ├── retrieval-augmented-generation.md
│   │   └── tokenization-and-embeddings.md
│   ├── index/
│   │   └── wiki-index.json      # Article index and categories
│   └── raw/                     # Raw source documents (input)
├── documentation/
│   ├── architecture-overview.md
│   ├── blockify-integration-guide.md
│   ├── getting-started.md
│   └── unit-test-checklist-template.md
├── pipeline/
│   ├── ingest.ts
│   ├── compile.ts
│   └── lint.ts
├── public/
│   └── static/
├── src/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # React components
│   └── lib/                     # Data layer and utilities
├── tests/                       # Jest test suites
├── CHANGELOG.md
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Server-side rendering, routing, API |
| Language | TypeScript | Type safety across the entire stack |
| Styling | Tailwind CSS v4 | Utility-first CSS framework |
| Search | Fuse.js | Client-side fuzzy full-text search |
| Markdown | remark + rehype | Markdown parsing and HTML rendering |
| Testing | Jest + Testing Library | Unit and integration tests |
| Linting | ESLint | Code quality enforcement |
| Data Format | JSON + Markdown/YAML | IdeaBlocks and wiki articles |

## How Blockify IdeaBlocks Differentiate This System

Traditional LLM-based wiki systems generate articles by prompting an LLM with a topic and relying on its parametric knowledge. This approach suffers from hallucination, lack of source attribution, inconsistency across articles, and difficulty updating specific facts.

Karpathypedia's Blockify-based approach introduces an intermediate representation — **IdeaBlocks** — that fundamentally changes the pipeline:

1. **Atomic Knowledge Units**: Each IdeaBlock captures a single critical question and its verified answer, with metadata including source documents, entities, and keywords. This atomic structure ensures every fact is individually traceable and verifiable.

2. **Pre-Distillation**: Raw blocks extracted from documents are refined through a distillation process that improves clarity, accuracy, and consistency before any article is generated. This quality gate prevents errors from propagating into published content.

3. **Compositional Article Generation**: Wiki articles are assembled from collections of relevant IdeaBlocks rather than generated from scratch. The LLM's role shifts from "recall and compose" to "organize and narrate," dramatically reducing hallucination.

4. **Granular Updates**: When source information changes, only the affected IdeaBlocks need updating. Articles referencing those blocks can be selectively recompiled without regenerating the entire knowledge base.

5. **Cross-Reference Integrity**: Because articles explicitly reference their source IdeaBlocks (via `ideablockIds` in frontmatter), the system can verify that every claim in an article is backed by a specific, reviewable knowledge unit.

This architecture treats the LLM as an assembly and narration tool operating on verified building blocks, rather than as a primary knowledge source — a design philosophy that prioritizes accuracy and maintainability over generation convenience.
