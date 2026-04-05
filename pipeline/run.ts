/**
 * pipeline/run.ts — Full pipeline orchestrator
 *
 * Single entry point: drop files in data/raw/ → run this → get a wiki.
 *
 *   Ingest → Distill → Graph (Louvain) → Compile (Claude) → Wiki
 *
 * Usage:
 *   npx tsx pipeline/run.ts [options]
 *
 * Options:
 *   --dry-run        Show what would happen without writing files
 *   --verbose        Enable detailed logging
 *   --skip-ingest    Skip ingest stage (use existing blocks)
 *   --skip-distill   Skip distillation (use blocks as-is)
 *   --resolution N   Louvain resolution parameter (default: 1.0)
 *   --raw-dir PATH   Override raw document directory
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { loadConfig, validateConfig } from './config';
import { ingest } from './ingest';
import { distill } from './distill';
import { buildGraphAndDetectCommunities } from './graph';
import { compile } from './compile';
import type { PipelineConfig, PipelineResult, IdeaBlock } from './types';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): Partial<PipelineConfig> & {
  skipIngest?: boolean;
  skipDistill?: boolean;
} {
  const args = process.argv.slice(2);
  const overrides: Record<string, unknown> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        overrides.dryRun = true;
        break;
      case '--verbose':
        overrides.verbose = true;
        break;
      case '--skip-ingest':
        overrides.skipIngest = true;
        break;
      case '--skip-distill':
        overrides.skipDistill = true;
        break;
      case '--resolution':
        overrides.louvainResolution = parseFloat(args[++i]);
        break;
      case '--raw-dir':
        overrides.rawDir = path.resolve(args[++i]);
        break;
    }
  }

  return overrides as Partial<PipelineConfig> & {
    skipIngest?: boolean;
    skipDistill?: boolean;
  };
}

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

async function loadExistingBlocks(config: PipelineConfig): Promise<IdeaBlock[]> {
  // Try distilled blocks first, then raw blocks
  const distilledPath = path.join(config.ideablocksDir, 'blocks-distilled.json');
  const rawPath = path.join(config.ideablocksDir, 'blocks.json');

  for (const filePath of [distilledPath, rawPath]) {
    if (await pathExists(filePath)) {
      const raw = await fs.readFile(filePath, 'utf-8');
      const blocks: IdeaBlock[] = JSON.parse(raw);
      console.log(`[pipeline] Loaded ${blocks.length} existing blocks from ${path.basename(filePath)}`);
      return blocks;
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function printBanner(): void {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    KARPATHYPEDIA PIPELINE                   ║');
  console.log('║                                                            ║');
  console.log('║   Raw Docs → Blockify Ingest → Distill → Graph (Louvain)  ║');
  console.log('║   → Claude Compile → Wikipedia-style Wiki                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printStageHeader(stage: string, number: number, total: number): void {
  console.log('');
  console.log(`━━━ Stage ${number}/${total}: ${stage} ━━━`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function runPipeline(): Promise<void> {
  const startTime = Date.now();

  printBanner();

  // Parse CLI args and load config
  const cliOverrides = parseArgs();
  const skipIngest = cliOverrides.skipIngest ?? false;
  const skipDistill = cliOverrides.skipDistill ?? false;
  delete cliOverrides.skipIngest;
  delete cliOverrides.skipDistill;

  const config = loadConfig(cliOverrides);

  if (config.dryRun) {
    console.log('[pipeline] DRY RUN — no files will be written');
    console.log('');
  }

  // Validate config
  const needsBlockify = !skipIngest;
  const needsClaude = true;
  const errors: string[] = [];

  if (needsBlockify && !config.blockifyApiKey) {
    errors.push('BLOCKIFY_API_KEY is required for ingest/distill stages. Set it as an environment variable.');
  }
  if (needsClaude && !config.anthropicApiKey) {
    console.warn('[pipeline] WARNING: ANTHROPIC_API_KEY not set — articles will use template-based fallback instead of Claude');
  }

  if (errors.length > 0) {
    console.error('[pipeline] Configuration errors:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Ensure directories exist
  for (const dir of [config.rawDir, config.ideablocksDir, config.wikiDir, config.indexDir]) {
    await fs.mkdir(dir, { recursive: true });
  }

  const totalStages = (skipIngest ? 0 : 1) + (skipDistill ? 0 : 1) + 2; // graph + compile always run
  let currentStage = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 1: INGEST — Raw documents → IdeaBlocks
  // ─────────────────────────────────────────────────────────────────────────

  let blocks: IdeaBlock[] = [];

  if (!skipIngest) {
    currentStage++;
    printStageHeader('INGEST (Raw Documents → IdeaBlocks via Blockify)', currentStage, totalStages);

    // Check for raw documents
    const rawFiles = await fs.readdir(config.rawDir).catch(() => []);
    const docFiles = rawFiles.filter((f) => /\.(md|txt|pdf|html)$/i.test(f));

    if (docFiles.length === 0) {
      console.log(`[ingest] No documents found in ${config.rawDir}`);
      console.log('[ingest] Drop .md, .txt, .pdf, or .html files into data/raw/ and re-run.');

      // Fall back to existing blocks
      blocks = await loadExistingBlocks(config);
      if (blocks.length === 0) {
        console.error('[pipeline] No documents to ingest and no existing blocks. Nothing to do.');
        process.exit(0);
      }
    } else {
      console.log(`[ingest] Found ${docFiles.length} document(s) in ${config.rawDir}`);

      const ingestResult = await ingest(config);
      blocks = ingestResult.blocks;

      console.log(`[ingest] ✓ Extracted ${blocks.length} IdeaBlocks from ${ingestResult.filesProcessed} files (${ingestResult.chunksProcessed} chunks)`);
    }
  } else {
    console.log('[pipeline] Skipping ingest stage (--skip-ingest)');
    blocks = await loadExistingBlocks(config);
    if (blocks.length === 0) {
      console.error('[pipeline] No existing blocks found. Remove --skip-ingest to process raw documents.');
      process.exit(1);
    }
    console.log(`[pipeline] Using ${blocks.length} existing IdeaBlocks`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 2: DISTILL — Deduplicate and merge similar blocks
  // ─────────────────────────────────────────────────────────────────────────

  if (!skipDistill) {
    currentStage++;
    printStageHeader('DISTILL (Deduplicate + Merge via Blockify)', currentStage, totalStages);

    console.log(`[distill] Processing ${blocks.length} blocks with similarity threshold ${config.similarityThreshold}`);

    const distillResult = await distill(blocks, config);
    blocks = distillResult.blocks;

    console.log(`[distill] ✓ ${distillResult.originalCount} → ${distillResult.finalCount} blocks (${distillResult.reductionPercent.toFixed(1)}% reduction)`);
    if (distillResult.merges.length > 0) {
      console.log(`[distill]   ${distillResult.merges.length} merge(s) performed`);
    }
  } else {
    console.log('[pipeline] Skipping distillation stage (--skip-distill)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 3: GRAPH — Build entity graph + Louvain community detection
  // ─────────────────────────────────────────────────────────────────────────

  currentStage++;
  printStageHeader('GRAPH (Entity Graph + Louvain Community Detection)', currentStage, totalStages);

  console.log(`[graph] Building graph from ${blocks.length} blocks (resolution: ${config.louvainResolution})`);

  const graphResult = await buildGraphAndDetectCommunities(blocks, config);

  console.log(`[graph] ✓ ${graphResult.totalNodes} nodes, ${graphResult.totalEdges} edges, modularity: ${graphResult.modularity.toFixed(4)}`);
  console.log(`[graph]   ${graphResult.communities.length} communities detected:`);
  for (const community of graphResult.communities) {
    console.log(`[graph]     - "${community.topic}" (${community.blocks.length} blocks, level ${community.level}, ${community.neighborCommunityIds.length} neighbors)`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 4: COMPILE — Claude writes wiki articles from communities
  // ─────────────────────────────────────────────────────────────────────────

  currentStage++;
  printStageHeader('COMPILE (Wiki Articles via Claude claude-sonnet-4-6)', currentStage, totalStages);

  const compileResult = await compile(graphResult, config);

  console.log(`[compile] ✓ ${compileResult.totalArticles} articles written across ${compileResult.categories.length} categories`);
  for (const article of compileResult.articles) {
    console.log(`[compile]   - "${article.title}" (${article.wordCount} words, ${article.ideablockIds.length} blocks)`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────

  const durationMs = Date.now() - startTime;
  const durationSec = (durationMs / 1000).toFixed(1);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     PIPELINE COMPLETE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  IdeaBlocks:   ${blocks.length}`);
  console.log(`  Communities:  ${graphResult.communities.length}`);
  console.log(`  Articles:     ${compileResult.totalArticles}`);
  console.log(`  Categories:   ${compileResult.categories.length}`);
  console.log(`  Duration:     ${durationSec}s`);
  console.log('');
  console.log(`  Wiki:         ${config.wikiDir}`);
  console.log(`  IdeaBlocks:   ${config.ideablocksDir}`);
  console.log(`  Index:        ${config.indexDir}/wiki-index.json`);
  console.log('');
  console.log('  Run "npm run dev" to view your wiki at http://localhost:3000');
  console.log('');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

runPipeline().catch((err) => {
  console.error('');
  console.error('[pipeline] Fatal error:', err);
  process.exit(1);
});
