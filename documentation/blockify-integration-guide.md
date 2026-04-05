# Blockify Integration Guide

This document describes how the Blockify IdeaBlock pipeline integrates with Karpathypedia, covering the data format, ingest process, distillation, article compilation, and configuration.

## IdeaBlock Format and Schema

Each IdeaBlock is an atomic knowledge unit representing a single critical question and its verified answer. The JSON schema is as follows:

```typescript
interface IdeaBlock {
  id: string;                    // Format: "ib_" + 16-character hex string
  name: string;                  // Human-readable block title
  criticalQuestion: string;      // The question this block answers
  trustedAnswer: string;         // Verified, comprehensive answer
  tags: string[];                // Classification tags (e.g., "TECHNOLOGY", "IMPORTANT")
  entities: Entity[];            // Named entities referenced in the block
  keywords: string[];            // Search keywords for retrieval
  sourceDocument: string;        // Original source document filename
  blockType: "raw" | "distilled" | "merged";  // Processing stage
  createdAt: string;             // ISO 8601 timestamp
  distilled: boolean;            // Whether distillation has been applied
}

interface Entity {
  name: string;                  // Entity display name
  type: string;                  // Entity category (TECHNOLOGY, CONCEPT, RESEARCHER, etc.)
}
```

### Block Types

| Type | Description |
|------|-------------|
| `raw` | Extracted directly from source documents without LLM refinement |
| `distilled` | Refined by LLM for clarity, accuracy, and completeness |
| `merged` | Created by combining multiple related raw blocks into a comprehensive unit |

### Tag Taxonomy

Tags serve dual purposes: classification for browsing and signals for the compilation pipeline.

| Tag | Purpose |
|-----|---------|
| `IMPORTANT` | High-priority block, should appear prominently in articles |
| `DETAILED` | Contains in-depth technical explanation |
| `TECHNOLOGY` | Describes a specific technology or tool |
| `CONCEPT` | Describes a theoretical concept or principle |
| `FOUNDATIONS` | Core fundamental knowledge |
| `ARCHITECTURE` | System or model architecture description |
| `APPLICATIONS` | Practical application or technique |
| `DATA_PROCESSING` | Data handling and transformation |
| `TRAINING` | Model training methodology |
| `OPTIMIZATION` | Performance optimization technique |

## Ingest Pipeline Steps

The ingest pipeline transforms raw documents into IdeaBlocks through the following stages:

### Step 1: Document Parsing

```
Input:  /data/raw/*.pdf, *.txt, *.md
Output: Parsed text with structural metadata
```

Raw documents are loaded and parsed to extract text content while preserving structural information (headings, sections, lists). PDF parsing extracts text with layout awareness, while markdown and text files are processed directly.

### Step 2: Chunking

```
Input:  Parsed text
Output: Document chunks (256-1024 tokens each)
```

Text is split into semantically coherent chunks using recursive character splitting with fallback separators (section breaks > paragraphs > sentences). Overlap of 50-100 tokens ensures information spanning chunk boundaries is preserved.

### Step 3: Question Extraction

```
Input:  Document chunks
Output: Raw IdeaBlocks with critical questions
```

An LLM analyzes each chunk to identify the key questions the content answers. For each identified question, a raw IdeaBlock is created with:
- The critical question
- The answer extracted from the chunk
- Entity and keyword extraction
- Source document reference

### Step 4: Deduplication

```
Input:  All raw IdeaBlocks
Output: Deduplicated block set
```

Embedding-based similarity comparison identifies duplicate or near-duplicate blocks. Blocks with cosine similarity above 0.92 are flagged for review or automatic merging.

### Pipeline Script Usage

```bash
# Run the full ingest pipeline
npx tsx pipeline/ingest.ts

# Ingest specific documents
npx tsx pipeline/ingest.ts --input data/raw/my-document.pdf

# Dry run (show what would be created)
npx tsx pipeline/ingest.ts --dry-run
```

## Distillation Process

Distillation refines raw IdeaBlocks into high-quality knowledge units using an LLM.

### Distillation Steps

1. **Answer Refinement**: The LLM rewrites the trusted answer for clarity, accuracy, and completeness while preserving technical precision.

2. **Entity Enrichment**: Additional entities are identified and typed (TECHNOLOGY, CONCEPT, RESEARCHER, ORGANIZATION, etc.).

3. **Keyword Expansion**: The keyword list is expanded with synonyms, abbreviations, and related terms to improve search coverage.

4. **Tag Classification**: Blocks are classified with appropriate tags based on content analysis.

5. **Cross-Reference Detection**: The system identifies which other blocks are semantically related, enabling cross-linking in compiled articles.

### Running Distillation

Distillation is triggered as part of the ingest pipeline or can be run separately:

```bash
# Distill all raw blocks
npx tsx pipeline/ingest.ts --distill

# Distill specific blocks
npx tsx pipeline/ingest.ts --distill --block-ids ib_a3f7c91e2d4b08a1,ib_b8e2d04f6a1c73e9
```

## How Blocks Map to Articles

The compilation step assembles IdeaBlocks into wiki articles. The mapping is determined by:

1. **Topic Clustering**: Blocks are clustered by semantic similarity of their critical questions and keywords using embedding-based grouping.

2. **Category Assignment**: Each cluster is assigned to a wiki category (Architecture, Foundations, Applications, Data Processing) based on the dominant tags in its blocks.

3. **Article Scoping**: For each cluster, the system determines the article scope — its title, slug, and the specific blocks to include.

4. **Content Generation**: An LLM generates the article markdown using the assigned IdeaBlocks as source material, ensuring:
   - Every claim is traceable to a specific block
   - Internal links to related articles are included
   - The encyclopedic tone is maintained
   - Frontmatter includes `ideablockIds` for all referenced blocks

5. **Index Update**: The wiki index (`/data/index/wiki-index.json`) is updated with the new article metadata.

### Article Frontmatter ↔ Block Mapping

Each article's frontmatter contains an `ideablockIds` array listing every block that informed its content:

```yaml
ideablockIds: ["ib_a3f7c91e2d4b08a1", "ib_b8e2d04f6a1c73e9", "ib_8c1a3e5f7b9d26ea"]
```

This enables:
- **Provenance tracking**: Every article section can be traced to verified source blocks
- **Staleness detection**: When a block is updated, all articles referencing it are flagged for recompilation
- **Coverage analysis**: Identifying blocks not yet represented in any article

### Running Compilation

```bash
# Compile all articles from current blocks
npx tsx pipeline/compile.ts

# Compile a specific article
npx tsx pipeline/compile.ts --slug transformer-architecture

# Validate compiled articles against their source blocks
npx tsx pipeline/lint.ts
```

## API Endpoints

The Next.js API layer exposes IdeaBlocks and articles for the frontend:

| Endpoint | Method | Parameters | Response |
|----------|--------|-----------|----------|
| `GET /api/blocks` | GET | `?tag=IMPORTANT&type=distilled&keyword=transformer` | Array of matching IdeaBlocks |
| `GET /api/blocks/[id]` | GET | Block ID in path | Single IdeaBlock with full detail |
| `GET /api/articles` | GET | `?category=Architecture` | Array of article summaries |
| `GET /api/articles/[slug]` | GET | Article slug in path | Full article with rendered content |
| `GET /api/search` | GET | `?q=attention+mechanism&limit=10` | Search results across blocks and articles |

## Configuration

Pipeline configuration is managed through environment variables and the pipeline config:

### Environment Variables

```env
# LLM provider for distillation and compilation
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=your-api-key-here

# Embedding model for similarity search
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536

# Pipeline settings
CHUNK_SIZE=512
CHUNK_OVERLAP=50
SIMILARITY_THRESHOLD=0.92
MAX_BLOCKS_PER_ARTICLE=10
```

### Pipeline Config (`/pipeline/config.ts`)

```typescript
export const pipelineConfig = {
  ingest: {
    chunkSize: 512,
    chunkOverlap: 50,
    supportedFormats: ['.pdf', '.txt', '.md'],
    outputPath: 'data/ideablocks/blocks.json',
  },
  distill: {
    model: process.env.LLM_MODEL || 'gpt-4o',
    temperature: 0.3,
    maxRetries: 3,
  },
  compile: {
    model: process.env.LLM_MODEL || 'gpt-4o',
    temperature: 0.5,
    articleOutputPath: 'data/wiki/',
    indexOutputPath: 'data/index/wiki-index.json',
    maxBlocksPerArticle: 10,
  },
  lint: {
    checkOrphanedBlocks: true,
    checkBrokenLinks: true,
    checkIdConsistency: true,
  },
};
```

## Data Integrity Checks

The lint script (`pipeline/lint.ts`) validates:

1. **ID Consistency**: Every `ideablockId` in article frontmatter corresponds to a block in `blocks.json`
2. **Orphaned Blocks**: Blocks not referenced by any article (warning, not error)
3. **Broken Links**: Internal wiki links (`/wiki/slug`) that don't match any article slug
4. **Schema Validation**: All blocks and articles conform to their respective schemas
5. **Slug Uniqueness**: No duplicate article slugs exist

```bash
# Run all lint checks
npx tsx pipeline/lint.ts

# Run specific check
npx tsx pipeline/lint.ts --check id-consistency
```
