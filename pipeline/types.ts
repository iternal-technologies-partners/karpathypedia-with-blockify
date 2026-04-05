/**
 * pipeline/types.ts — Shared types for all pipeline stages
 *
 * These interfaces define the data contracts between pipeline stages:
 *   Ingest → Distill → Graph → Compile → Wiki
 */

// ---------------------------------------------------------------------------
// Core IdeaBlock (mirrors src/lib/types.ts for pipeline independence)
// ---------------------------------------------------------------------------

export interface Entity {
  name: string;
  type: string;
}

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
// Stage 1: Ingest
// ---------------------------------------------------------------------------

export interface TextChunk {
  sourceFile: string;
  chunkIndex: number;
  content: string;
  charCount: number;
}

export interface IngestResult {
  blocks: IdeaBlock[];
  chunksProcessed: number;
  filesProcessed: number;
  sourceDir: string;
}

// ---------------------------------------------------------------------------
// Stage 2: Distill
// ---------------------------------------------------------------------------

export interface MergeRecord {
  originalIds: string[];
  mergedBlock: IdeaBlock;
}

export interface DistillResult {
  blocks: IdeaBlock[];           // final set (merged + untouched)
  merges: MergeRecord[];         // what was merged
  originalCount: number;
  finalCount: number;
  reductionPercent: number;
}

// ---------------------------------------------------------------------------
// Stage 3: Graph + Community Detection
// ---------------------------------------------------------------------------

export interface GraphEdge {
  source: string;   // entity or block id
  target: string;
  weight: number;
  type: 'co-occurrence' | 'tag-overlap' | 'keyword-overlap';
}

export interface Community {
  id: number;
  level: number;          // 0=fine(sections), 1=mid(articles), 2=coarse(categories)
  topic: string;          // derived from highest-degree entity in community
  blocks: IdeaBlock[];
  entityNames: string[];  // all entities in this community
  neighborCommunityIds: number[];  // connected communities (for cross-links)
}

export interface GraphResult {
  communities: Community[];
  totalNodes: number;
  totalEdges: number;
  modularity: number;
}

// ---------------------------------------------------------------------------
// Stage 4: Compile
// ---------------------------------------------------------------------------

export interface CompiledArticle {
  slug: string;
  title: string;
  summary: string;
  content: string;       // markdown body
  category: string;
  tags: string[];
  relatedSlugs: string[];
  ideablockIds: string[];
  lastUpdated: string;
  wordCount: number;
  communityId: number;
}

export interface CompileResult {
  articles: CompiledArticle[];
  categories: { name: string; slug: string; articleCount: number; description: string }[];
  totalArticles: number;
  totalBlocks: number;
}

// ---------------------------------------------------------------------------
// Full pipeline
// ---------------------------------------------------------------------------

export interface PipelineConfig {
  blockifyApiKey: string;
  anthropicApiKey: string;
  blockifyApiUrl: string;
  claudeModel: string;
  rawDir: string;
  ideablocksDir: string;
  wikiDir: string;
  indexDir: string;
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;   // for distillation merge candidates
  louvainResolution: number;     // Louvain resolution parameter
  maxBlocksPerDistillCall: number;
  maxBlocksPerArticle: number;
  dryRun: boolean;
  verbose: boolean;
}

export interface PipelineResult {
  ingest: IngestResult;
  distill: DistillResult;
  graph: GraphResult;
  compile: CompileResult;
  durationMs: number;
}
