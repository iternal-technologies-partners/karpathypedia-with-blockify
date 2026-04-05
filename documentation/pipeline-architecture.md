# Pipeline Architecture — Graph-Powered Wiki Compilation

## Overview

The Karpathypedia pipeline transforms raw documents into a Wikipedia-style wiki through a 4-stage process that combines Blockify IdeaBlock extraction, Jaccard-based deduplication, GraphRAG-inspired community detection, and Claude-powered article writing.

```
data/raw/*.md,txt    →  [INGEST]  →  Raw IdeaBlocks
                         Blockify API (model: "ingest")
                         ~2000 char chunks → XML IdeaBlock parsing

Raw IdeaBlocks       →  [DISTILL]  →  Deduplicated IdeaBlocks
                         Jaccard similarity (keyword/entity/tag)
                         BFS connected components → Blockify API (model: "distill")

Distilled IdeaBlocks →  [GRAPH]  →  Louvain Communities
                         Block-only graph (no entity nodes)
                         Edge weight = 0.45*entityJaccard + 0.35*keywordJaccard + 0.20*tagJaccard
                         Louvain community detection with configurable resolution
                         Hierarchical refinement: split large, merge singletons

Communities          →  [COMPILE]  →  Wiki Articles
                         Claude claude-sonnet-4-6 per community
                         YAML frontmatter + markdown
                         Cross-links from graph neighbor communities
```

## Stage Details

### Stage 1: Ingest (`pipeline/ingest.ts`)

- **Input**: `.md`, `.txt`, `.pdf`, `.html` files in `data/raw/`
- **Chunking**: ~2000 chars, split at paragraph/sentence boundaries, 200 char overlap
- **API**: `POST https://api.blockify.ai/v1/chat/completions` with `model: "ingest"`
- **Output**: IdeaBlocks with deterministic IDs (`ib_` + SHA-256 hash)
- **Requires**: `BLOCKIFY_API_KEY`

### Stage 2: Distill (`pipeline/distill.ts`)

- **Similarity**: Combined Jaccard across three signals:
  - 50% keyword overlap
  - 30% entity name overlap
  - 20% tag overlap
- **Clustering**: BFS connected components on pairs above threshold (default 0.55)
- **Merging**: Blockify distill API merges clusters of 2-15 blocks
- **Output**: Deduplicated blocks with merge provenance tracking
- **Requires**: `BLOCKIFY_API_KEY`

### Stage 3: Graph (`pipeline/graph.ts`)

**Why block-only graph**: A bipartite graph (blocks + entities as separate nodes) causes cascade merging — shared entity nodes create too many cross-community connections. Block-only graphs, where entity similarity is encoded as edge weights, produce much cleaner community detection. This aligns with GraphRAG's document-level clustering approach.

- **Nodes**: One per IdeaBlock
- **Edge weights**: `0.45 * entityJaccard + 0.35 * keywordJaccard + 0.20 * tagJaccard`
- **Edge threshold**: 0.15 (keeps graph sparse, only meaningful connections)
- **Community detection**: `graphology-communities-louvain` with configurable resolution
- **Refinement**:
  - Communities with 26+ blocks: recursively split with Louvain at 1.5x higher resolution
  - Singleton communities (1 block): merged into most-connected neighbor
  - Communities with 2+ blocks: promoted to article-level (level 1)

### Stage 4: Compile (`pipeline/compile.ts`)

- **LLM**: Claude `claude-sonnet-4-6` via `@anthropic-ai/sdk`
- **Prompt**: Community's blocks as structured Q&A, neighbor topics for cross-references, encyclopedic style instructions
- **Fallback**: Template-based Q&A listing when `ANTHROPIC_API_KEY` is not set
- **Output**: Markdown files with YAML frontmatter in `data/wiki/`, wiki index at `data/index/wiki-index.json`
- **Cross-links**: Graph neighbor communities → `relatedSlugs` in frontmatter + inline wiki links
- **Requires**: `ANTHROPIC_API_KEY`

## Running the Pipeline

```bash
# Full pipeline (requires both API keys)
BLOCKIFY_API_KEY=xxx ANTHROPIC_API_KEY=xxx npm run pipeline

# Skip ingest, use existing blocks
npm run pipeline:skip-ingest

# Skip ingest + distill (graph + compile only)
npm run pipeline:skip-all

# Dry run
npm run pipeline:dry

# Custom Louvain resolution (higher = more communities)
npx tsx pipeline/run.ts --skip-ingest --resolution 2.0
```

## Configuration

All settings via environment variables and CLI flags:

| Setting | Env Var | Default | CLI Flag |
|---------|---------|---------|----------|
| Blockify API Key | `BLOCKIFY_API_KEY` | required | — |
| Anthropic API Key | `ANTHROPIC_API_KEY` | required | — |
| Claude Model | — | `claude-sonnet-4-6` | — |
| Louvain Resolution | — | 1.0 | `--resolution N` |
| Similarity Threshold | — | 0.55 | — |
| Chunk Size | — | 2000 chars | — |
| Raw Documents Dir | — | `data/raw/` | `--raw-dir PATH` |

## Graph Design Decisions

### Why Louvain over Leiden?
Louvain is available as a pure JS package (`graphology-communities-louvain`), keeping the entire pipeline in TypeScript. Leiden produces slightly better partitions but requires Python. For wiki-scale datasets (hundreds to low thousands of blocks), Louvain is sufficient.

### Why Jaccard over embeddings for graph edges?
IdeaBlocks already have structured metadata (entities, keywords, tags) that enable precise similarity without external API calls. Jaccard on these pre-extracted features is:
- **Free**: No embedding API costs
- **Deterministic**: Same input always produces same graph
- **Fast**: O(n²) with small constant factor
- **Interpretable**: You can see exactly why two blocks are connected

For larger corpora (10k+ blocks), embedding-based similarity would improve recall at the cost of API calls and non-determinism.
