# Karpathypedia

**LLM-Powered Knowledge Base with Blockify IdeaBlocks + Graph-Driven Wiki Compilation**

Inspired by [Andrej Karpathy's concept](https://x.com/karpathy) of LLM-compiled knowledge bases, Karpathypedia transforms raw documents into a Wikipedia-style wiki through a structured pipeline. Rather than asking an LLM to generate articles from scratch, it first decomposes source material into atomic Q&A units (IdeaBlocks), builds a similarity graph, detects topical communities, and then assembles encyclopedic articles grounded in verified knowledge atoms.

---

## What Makes This Different

Most LLM wiki generators prompt a model with a topic and hope for the best. Karpathypedia takes a fundamentally different approach:

1. **Atomic decomposition first.** Raw documents are processed into IdeaBlocks — structured Q&A pairs with entities, keywords, and tags — via the [Blockify](https://blockify.ai) ingest API. Each block is a single, verifiable fact.

2. **Deduplication via Jaccard similarity + Blockify distill.** Overlapping blocks are identified using combined Jaccard similarity across keywords (50%), entities (30%), and tags (20%). Clusters above the similarity threshold are merged through the Blockify distill API.

3. **Graph-based community detection.** A block-only graph is built where edge weights encode entity, keyword, and tag overlap. [Louvain community detection](https://en.wikipedia.org/wiki/Louvain_method) groups related blocks into article-sized clusters, with hierarchical refinement (splitting oversized communities, merging singletons).

4. **LLM as narrator, not source.** Claude Sonnet writes Wikipedia-style articles for each community, using the IdeaBlocks as source material. The LLM organizes and narrates verified facts rather than recalling from parametric memory.

5. **Graph-driven cross-linking.** Neighbor communities in the graph become related articles, producing a naturally interconnected wiki with meaningful cross-references.

> "Raw data from a given number of sources is collected, then compiled by an LLM into a .md wiki." — Andrej Karpathy

---

## Architecture

```
Raw Documents (.md, .txt, .pdf, .html)
        |
        v
  +-----------------+
  | Blockify Ingest |  Chunk documents, extract Q&A pairs
  +-----------------+
        |
        v
   Raw IdeaBlocks
        |
        v
  +-----------------+
  |  Distillation   |  Jaccard similarity + Blockify distill API
  +-----------------+  Deduplicate and merge overlapping blocks
        |
        v
  Deduplicated Blocks
        |
        v
  +-----------------+
  | Graph + Louvain |  Block-only graph with weighted similarity edges
  +-----------------+  Community detection -> article-sized clusters
        |
        v
    Communities
        |
        v
  +-----------------+
  | Claude Sonnet   |  Write encyclopedic articles per community
  +-----------------+  Cross-link via graph neighbor communities
        |
        v
   Wiki Articles (Markdown + YAML frontmatter)
        |
        v
  +-----------------+
  |   Next.js UI    |  Wikipedia-style browsing, search, exploration
  +-----------------+
```

---

## Features

**Wiki UI**
- Wikipedia-style responsive interface built with Next.js and Tailwind CSS
- Article pages with auto-generated table of contents, backlinks, and related articles
- Category browsing and filtering
- Full-text search across articles and IdeaBlocks (Fuse.js)
- IdeaBlock Explorer for browsing atomic knowledge units

**Pipeline**
- 4-stage pipeline: Ingest, Distill, Graph, Compile
- GraphRAG-inspired Louvain community detection for topic clustering
- Blockify IdeaBlock pre-processing for atomic, traceable knowledge units
- Template fallback when no Claude API key is set (still generates articles)
- CLI with `--skip-ingest`, `--skip-distill`, `--dry-run`, `--resolution`, `--verbose` flags
- Provenance tracking: every article references its source IdeaBlock IDs

---

## Quick Start

### Prerequisites

- **Node.js** 18.17+ (recommended: 20.x LTS)
- **npm** 9.x+

### Setup

```bash
git clone https://github.com/your-org/karpathypedia-with-blockify.git
cd karpathypedia-with-blockify
npm install
cp .env.example .env
```

Edit `.env` with your API keys:

```env
BLOCKIFY_API_KEY=your-blockify-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the wiki. Sample data is included so you can explore immediately without running the pipeline.

---

## Pipeline Usage

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run pipeline` | Run the full pipeline (ingest, distill, graph, compile) |
| `npm run pipeline:skip-ingest` | Skip ingest stage, use existing blocks |
| `npm run pipeline:skip-all` | Skip ingest + distill (graph + compile only) |
| `npm run pipeline:dry` | Dry run with verbose logging |

### Custom Flags

```bash
# Adjust Louvain resolution (higher = more, smaller communities)
npx tsx pipeline/run.ts --resolution 2.0

# Point to a different raw documents directory
npx tsx pipeline/run.ts --raw-dir /path/to/docs

# Verbose logging
npx tsx pipeline/run.ts --verbose

# Combine flags
npx tsx pipeline/run.ts --skip-ingest --resolution 1.5 --verbose
```

### Pipeline Requirements

- **Ingest + Distill stages**: Requires `BLOCKIFY_API_KEY`
- **Compile stage**: Requires `ANTHROPIC_API_KEY` (falls back to template-based generation if not set)

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOCKIFY_API_KEY` | Yes (pipeline) | API key for Blockify ingest and distill |
| `ANTHROPIC_API_KEY` | Yes (pipeline) | API key for Claude article compilation |
| `BLOCKIFY_API_URL` | No | Blockify API endpoint (default: `https://api.blockify.ai/v1/chat/completions`) |

### Pipeline Defaults

| Setting | Default | CLI Override |
|---------|---------|--------------|
| Claude Model | `claude-sonnet-4-6` | -- |
| Louvain Resolution | `1.0` | `--resolution N` |
| Similarity Threshold | `0.55` | -- |
| Chunk Size | `2000` chars | -- |
| Chunk Overlap | `200` chars | -- |
| Max Blocks per Distill Call | `15` | -- |
| Max Blocks per Article | `25` | -- |
| Raw Documents Directory | `data/raw/` | `--raw-dir PATH` |
| Dry Run | `false` | `--dry-run` |
| Verbose | `false` | `--verbose` |

---

## Project Structure

```
karpathypedia-with-blockify/
├── data/
│   ├── raw/                     # Source documents (input)
│   ├── ideablocks/              # Extracted IdeaBlocks (JSON)
│   ├── wiki/                    # Compiled wiki articles (Markdown)
│   └── index/                   # Wiki index and metadata (JSON)
├── pipeline/
│   ├── run.ts                   # Pipeline orchestrator + CLI entry point
│   ├── config.ts                # Configuration loader with defaults
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── ingest.ts                # Stage 1: Document -> IdeaBlocks
│   ├── distill.ts               # Stage 2: Deduplication + merge
│   ├── graph.ts                 # Stage 3: Graph construction + Louvain
│   ├── compile.ts               # Stage 4: Community -> Wiki article
│   └── lint.ts                  # Validation and consistency checks
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # Homepage
│   │   ├── wiki/[slug]/         # Article detail pages
│   │   ├── ideablocks/          # IdeaBlock explorer + detail
│   │   ├── category/[name]/     # Category browsing
│   │   ├── search/              # Search results page
│   │   └── api/                 # REST API routes
│   ├── components/
│   │   ├── wiki/                # ArticleView, ArticleCard, BackLinks, InfoBox, CategoryList
│   │   ├── ideablocks/          # IdeaBlockCard, IdeaBlockGrid
│   │   ├── layout/              # Header, Sidebar, Footer, TableOfContents
│   │   ├── search/              # SearchBar, SearchResults
│   │   └── common/              # TagBadge, Breadcrumb, MarkdownRenderer
│   └── lib/                     # Data loading, search, types
│       ├── types.ts             # Frontend type definitions
│       ├── wiki.ts              # Article data loading and queries
│       ├── ideablocks.ts        # IdeaBlock data loading and queries
│       └── search.ts            # Fuse.js search engine
├── tests/                       # Jest test suites
├── documentation/               # Architecture docs and guides
├── .env.example                 # Template for environment variables
├── package.json
├── tsconfig.json
├── next.config.ts
└── CHANGELOG.md
```

---

## How It Works

### Stage 1: Ingest

Raw documents in `data/raw/` are chunked into ~2000-character segments (split at paragraph/sentence boundaries with 200-char overlap). Each chunk is sent to the Blockify ingest API, which extracts structured IdeaBlocks — atomic Q&A pairs with entities, keywords, tags, and source provenance. Block IDs are deterministic (`ib_` + SHA-256 hash).

### Stage 2: Distill

Blocks are compared pairwise using combined Jaccard similarity across three signals: keywords (50%), entity names (30%), and tags (20%). BFS finds connected components among pairs above the threshold (default: 0.55). Each cluster of 2-15 similar blocks is sent to the Blockify distill API, which merges them into a single, comprehensive block. Merge provenance is tracked.

### Stage 3: Graph + Louvain

A block-only graph is constructed (no separate entity nodes — this avoids cascade merging from shared entities). Edge weights are computed as `0.45 * entityJaccard + 0.35 * keywordJaccard + 0.20 * tagJaccard`, with a minimum threshold of 0.15. Louvain community detection partitions blocks into article-sized clusters. Large communities (26+ blocks) are recursively split at higher resolution; singletons are merged into their most-connected neighbor.

### Stage 4: Compile

Each community is sent to Claude Sonnet (`claude-sonnet-4-6`) with its blocks formatted as structured Q&A pairs and neighbor community topics for cross-referencing. The model writes a Wikipedia-style article with proper sections, internal links, and encyclopedic tone. Output is Markdown with YAML frontmatter (title, summary, category, tags, related slugs, IdeaBlock IDs). A wiki index is generated at `data/index/wiki-index.json`. If no `ANTHROPIC_API_KEY` is set, a template-based fallback produces Q&A-formatted articles.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | SSR, routing, API routes |
| Language | TypeScript | Type safety across pipeline and UI |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| Graph | [graphology](https://graphology.github.io/) + graphology-communities-louvain | Graph construction and community detection |
| LLM | [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) (Claude Sonnet) | Article compilation |
| Knowledge Extraction | [Blockify API](https://blockify.ai) | IdeaBlock ingest and distillation |
| Search | [Fuse.js](https://www.fusejs.io/) | Client-side fuzzy full-text search |
| Markdown | react-markdown, remark-gfm, rehype-slug, rehype-highlight | Markdown rendering with syntax highlighting |
| Frontmatter | gray-matter | YAML frontmatter parsing |
| Testing | Jest + Testing Library | Unit and integration tests |

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project (type checking + production build)
npm run build

# Lint
npm run lint
```

---

## API Routes

The Next.js backend exposes REST endpoints for the frontend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search?q=query` | GET | Full-text search across articles and blocks |
| `/api/articles` | GET | List all articles (optional category filter) |
| `/api/ideablocks` | GET | List IdeaBlocks (optional tag/keyword filters) |

---

## Inspiration

This project is inspired by Andrej Karpathy's vision of LLM-compiled knowledge bases: the idea that raw information from diverse sources can be systematically collected, structured, and compiled by language models into comprehensive, interconnected wiki-style references.

Karpathypedia extends this concept by introducing an intermediate IdeaBlock layer. Instead of feeding raw text directly to an LLM for article generation, documents are first decomposed into atomic, metadata-rich knowledge units. This produces articles that are more accurate (grounded in specific facts), more traceable (every claim maps to a source block), and more maintainable (update a block, recompile affected articles).

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and add tests
4. Run `npm test` and `npm run build` to verify
5. Open a pull request

---

## License

This project is open source. See the repository for license details.
