/**
 * pipeline/ingest.ts — Modular ingest stage
 *
 * Scans a raw-document directory for .md, .txt, .pdf, .html files, chunks them,
 * sends each chunk through the Blockify ingest API to extract IdeaBlocks, and
 * persists the resulting blocks to disk.
 *
 * Exports a single `ingest()` function consumed by the pipeline orchestrator.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { PipelineConfig, IngestResult, IdeaBlock, TextChunk, Entity } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.pdf', '.html']);

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively list all supported files in a directory.
 */
async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Split text into overlapping chunks of approximately `chunkSize` characters.
 * Prefers splitting on paragraph boundaries (`\n\n`), then sentence boundaries (`. `).
 */
function chunkText(
  text: string,
  sourceFile: string,
  chunkSize: number,
  chunkOverlap: number,
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let offset = 0;
  let chunkIndex = 0;

  while (offset < text.length) {
    let end = Math.min(offset + chunkSize, text.length);

    // Try to break on a paragraph boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > offset + chunkSize / 2) {
        end = paragraphBreak + 2; // include the double newline
      } else {
        // Fall back to sentence boundary
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > offset + chunkSize / 2) {
          end = sentenceBreak + 2;
        }
      }
    }

    const content = text.slice(offset, end).trim();

    if (content.length > 0) {
      chunks.push({
        sourceFile: path.basename(sourceFile),
        chunkIndex,
        content,
        charCount: content.length,
      });
      chunkIndex += 1;
    }

    // Advance with overlap (no overlap on the final chunk)
    offset = end - (end < text.length ? chunkOverlap : 0);

    // Safety: always make forward progress
    if (offset <= (end - chunkSize) || offset <= 0) {
      offset = end;
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

/** Extract text content from a simple XML tag. */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const m = regex.exec(xml);
  return m ? m[1].trim() : '';
}

/**
 * Parse the Blockify XML response into IdeaBlock objects.
 *
 * Expected XML format per block:
 *   <ideablock>
 *     <name>...</name>
 *     <critical_question>...</critical_question>
 *     <trusted_answer>...</trusted_answer>
 *     <tags>tag1, tag2</tags>
 *     <entity type="PERSON">Name</entity>
 *     <keywords>kw1, kw2</keywords>
 *   </ideablock>
 */
function parseIdeaBlockXml(xml: string, sourceFile: string): IdeaBlock[] {
  const blocks: IdeaBlock[] = [];
  const blockRegex = /<ideablock>([\s\S]*?)<\/ideablock>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(xml)) !== null) {
    const inner = match[1];

    const name = extractTag(inner, 'name');
    const criticalQuestion = extractTag(inner, 'critical_question');
    const trustedAnswer = extractTag(inner, 'trusted_answer');
    const tagsRaw = extractTag(inner, 'tags');
    const keywordsRaw = extractTag(inner, 'keywords');

    // Parse entities
    const entities: Entity[] = [];
    const entityRegex = /<entity\s+type="([^"]*)">([\s\S]*?)<\/entity>/gi;
    let entityMatch: RegExpExecArray | null;
    while ((entityMatch = entityRegex.exec(inner)) !== null) {
      entities.push({ name: entityMatch[2].trim(), type: entityMatch[1] });
    }

    // Generate deterministic block ID: ib_ + first 16 chars of SHA-256
    const hashInput = (name || '') + (criticalQuestion || '') + (trustedAnswer || '');
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const id = `ib_${hash.slice(0, 16)}`;

    blocks.push({
      id,
      name: name || 'Untitled Block',
      criticalQuestion: criticalQuestion || '',
      trustedAnswer: trustedAnswer || '',
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
      entities,
      keywords: keywordsRaw ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean) : [],
      sourceDocument: sourceFile,
      blockType: 'raw',
      createdAt: new Date().toISOString(),
      distilled: false,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Blockify API integration
// ---------------------------------------------------------------------------

/**
 * Call the Blockify ingest API to extract IdeaBlocks from a text chunk.
 */
async function callBlockifyIngest(
  chunk: TextChunk,
  config: PipelineConfig,
): Promise<IdeaBlock[]> {
  const response = await fetch(config.blockifyApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.blockifyApiKey}`,
    },
    body: JSON.stringify({
      model: 'ingest',
      messages: [{ role: 'user', content: chunk.content }],
      max_tokens: 8000,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    console.error(
      `[ingest] API error ${response.status} for chunk ${chunk.chunkIndex} from ${chunk.sourceFile}`,
    );
    return [];
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawContent: string = data?.choices?.[0]?.message?.content ?? '';

  return parseIdeaBlockXml(rawContent, chunk.sourceFile);
}

// ---------------------------------------------------------------------------
// Main ingest function
// ---------------------------------------------------------------------------

/**
 * Ingest pipeline stage.
 *
 * Scans `config.rawDir` for supported files, chunks their text, sends each
 * chunk through Blockify ingest API, and saves extracted IdeaBlocks to disk.
 */
export async function ingest(config: PipelineConfig): Promise<IngestResult> {
  const emptyResult: IngestResult = {
    blocks: [],
    chunksProcessed: 0,
    filesProcessed: 0,
    sourceDir: config.rawDir,
  };

  // Guard: API key required
  if (!config.blockifyApiKey) {
    console.warn('[ingest] WARNING: blockifyApiKey is empty — returning empty result');
    return emptyResult;
  }

  // Ensure raw directory exists
  if (!(await pathExists(config.rawDir))) {
    console.error(`[ingest] Source directory not found: ${config.rawDir}`);
    return emptyResult;
  }

  // Discover files
  console.log(`[ingest] Scanning ${config.rawDir} for documents...`);
  const files = await listFiles(config.rawDir);
  console.log(`[ingest] Found ${files.length} document(s)`);

  if (files.length === 0) {
    console.log('[ingest] No documents to process.');
    return emptyResult;
  }

  // Chunk all documents
  const allChunks: TextChunk[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[ingest] Processing file ${i + 1} of ${files.length}: ${path.basename(file)}`);
    const text = await fs.readFile(file, 'utf-8');
    const chunks = chunkText(text, file, config.chunkSize, config.chunkOverlap);
    allChunks.push(...chunks);
    console.log(
      `[ingest]   ${path.basename(file)}: ${text.length} chars -> ${chunks.length} chunk(s)`,
    );
  }

  console.log(`[ingest] Total chunks: ${allChunks.length}`);

  // Process chunks through Blockify API
  // NOTE: Chunks are processed sequentially to respect API rate limits.
  // For higher throughput, consider parallelizing with a concurrency limiter (e.g. p-limit).
  const allBlocks: IdeaBlock[] = [];

  for (const chunk of allChunks) {
    try {
      const blocks = await callBlockifyIngest(chunk, config);
      allBlocks.push(...blocks);
      console.log(`[ingest]   Chunk ${chunk.chunkIndex}: extracted ${blocks.length} block(s)`);
    } catch (err) {
      console.error(
        `[ingest] Error processing chunk ${chunk.chunkIndex} from ${chunk.sourceFile}:`,
        err instanceof Error ? err.message : err,
      );
      // Skip failed chunks gracefully
    }
  }

  // Persist blocks — merge with any existing blocks.json
  await fs.mkdir(config.ideablocksDir, { recursive: true });
  const outputPath = path.join(config.ideablocksDir, 'blocks.json');

  let existingBlocks: IdeaBlock[] = [];
  if (await pathExists(outputPath)) {
    const raw = await fs.readFile(outputPath, 'utf-8');
    existingBlocks = JSON.parse(raw) as IdeaBlock[];
  }

  const merged = [...existingBlocks, ...allBlocks];
  await fs.writeFile(outputPath, JSON.stringify(merged, null, 2));

  console.log(`[ingest] Saved ${allBlocks.length} new IdeaBlock(s) to ${outputPath}`);
  console.log(`[ingest] Total blocks in corpus: ${merged.length}`);

  return {
    blocks: allBlocks,
    chunksProcessed: allChunks.length,
    filesProcessed: files.length,
    sourceDir: config.rawDir,
  };
}
