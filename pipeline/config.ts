/**
 * pipeline/config.ts — Pipeline configuration
 *
 * Reads from environment variables with sensible defaults.
 * Required env vars: BLOCKIFY_API_KEY, ANTHROPIC_API_KEY
 */

import path from 'path';
import type { PipelineConfig } from './types';

export function loadConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  const root = process.cwd();

  return {
    // API keys
    blockifyApiKey: process.env.BLOCKIFY_API_KEY ?? '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',

    // API endpoints
    blockifyApiUrl: process.env.BLOCKIFY_API_URL ?? 'https://api.blockify.ai/v1/chat/completions',
    claudeModel: 'claude-sonnet-4-6',

    // Directories
    rawDir: path.join(root, 'data', 'raw'),
    ideablocksDir: path.join(root, 'data', 'ideablocks'),
    wikiDir: path.join(root, 'data', 'wiki'),
    indexDir: path.join(root, 'data', 'index'),

    // Chunking
    chunkSize: 2000,
    chunkOverlap: 200,

    // Distillation
    similarityThreshold: 0.55,
    maxBlocksPerDistillCall: 15,

    // Graph / Louvain
    louvainResolution: 1.0,

    // Compilation
    maxBlocksPerArticle: 25,

    // Flags
    dryRun: false,
    verbose: false,

    // Allow overrides
    ...overrides,
  };
}

export function validateConfig(config: PipelineConfig): string[] {
  const errors: string[] = [];

  if (!config.blockifyApiKey) {
    errors.push('BLOCKIFY_API_KEY is required. Set it as an environment variable.');
  }
  if (!config.anthropicApiKey) {
    errors.push('ANTHROPIC_API_KEY is required. Set it as an environment variable.');
  }

  return errors;
}
