/**
 * pipeline/distill.ts — Lightweight distillation stage
 *
 * Deduplicates and merges similar IdeaBlocks using keyword/entity/tag
 * Jaccard similarity and the Blockify distill API.
 *
 * Pipeline position: Ingest -> **Distill** -> Graph -> Compile -> Wiki
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { PipelineConfig, DistillResult, IdeaBlock, MergeRecord, Entity } from './types';

// ---------------------------------------------------------------------------
// Similarity helpers
// ---------------------------------------------------------------------------

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B|.
 * Returns 0 when both sets are empty.
 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }

  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Compute combined similarity between two IdeaBlocks.
 *
 * combinedSim = 0.5 * keywordSim + 0.3 * entitySim + 0.2 * tagSim
 */
function combinedSimilarity(a: IdeaBlock, b: IdeaBlock): number {
  // Normalize all comparison values to lowercase
  const keywordsA = new Set(a.keywords.map((k) => k.toLowerCase()));
  const keywordsB = new Set(b.keywords.map((k) => k.toLowerCase()));
  const keywordSim = jaccard(keywordsA, keywordsB);

  const entitiesA = new Set(a.entities.map((e) => e.name.toLowerCase()));
  const entitiesB = new Set(b.entities.map((e) => e.name.toLowerCase()));
  const entitySim = jaccard(entitiesA, entitiesB);

  const tagsA = new Set(a.tags.map((t) => t.toLowerCase()));
  const tagsB = new Set(b.tags.map((t) => t.toLowerCase()));
  const tagSim = jaccard(tagsA, tagsB);

  return 0.5 * keywordSim + 0.3 * entitySim + 0.2 * tagSim;
}

// ---------------------------------------------------------------------------
// Graph clustering (BFS connected components)
// ---------------------------------------------------------------------------

/**
 * Build an adjacency list of block indices where combinedSim >= threshold,
 * then find connected components via BFS.
 *
 * O(n^2) comparison — acceptable at wiki scale (hundreds of blocks, not millions).
 */
function findClusters(blocks: IdeaBlock[], threshold: number): number[][] {
  const n = blocks.length;

  // Build adjacency list
  const adj: Map<number, Set<number>> = new Map();
  for (let i = 0; i < n; i++) {
    adj.set(i, new Set());
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = combinedSimilarity(blocks[i], blocks[j]);
      if (sim >= threshold) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
      }
    }
  }

  // BFS connected components
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;

    const component: number[] = [];
    const queue: number[] = [i];
    visited.add(i);

    while (queue.length > 0) {
      const node = queue.shift()!;
      component.push(node);

      for (const neighbor of adj.get(node)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    clusters.push(component);
  }

  return clusters;
}

// ---------------------------------------------------------------------------
// XML formatting / parsing
// ---------------------------------------------------------------------------

/** Extract text content from a simple XML tag. */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const m = regex.exec(xml);
  return m ? m[1].trim() : '';
}

/**
 * Format a set of IdeaBlocks as XML for the Blockify distill API input.
 */
function blocksToXml(blocks: IdeaBlock[]): string {
  return blocks
    .map(
      (b) =>
        `<ideablock>
  <name>${b.name}</name>
  <critical_question>${b.criticalQuestion}</critical_question>
  <trusted_answer>${b.trustedAnswer}</trusted_answer>
  <tags>${b.tags.join(', ')}</tags>
  <keywords>${b.keywords.join(', ')}</keywords>
</ideablock>`,
    )
    .join('\n');
}

/**
 * Parse a Blockify distill API response into IdeaBlock objects.
 * Uses the same XML format as the ingest response.
 */
function parseDistillResponse(xml: string): IdeaBlock[] {
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

    // Parse entities if present
    const entities: Entity[] = [];
    const entityRegex = /<entity\s+type="([^"]*)">([\s\S]*?)<\/entity>/gi;
    let entityMatch: RegExpExecArray | null;
    while ((entityMatch = entityRegex.exec(inner)) !== null) {
      entities.push({ name: entityMatch[2].trim(), type: entityMatch[1] });
    }

    // Generate deterministic block ID
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
      sourceDocument: undefined,
      blockType: 'merged',
      createdAt: new Date().toISOString(),
      distilled: true,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Blockify distill API
// ---------------------------------------------------------------------------

/**
 * Call the Blockify distill API to merge a cluster of similar blocks.
 * Returns the merged block(s) or null on failure.
 */
async function callBlockifyDistill(
  clusterBlocks: IdeaBlock[],
  config: PipelineConfig,
): Promise<IdeaBlock[] | null> {
  const xmlContent = blocksToXml(clusterBlocks);

  try {
    const response = await fetch(config.blockifyApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.blockifyApiKey}`,
      },
      body: JSON.stringify({
        model: 'distill',
        messages: [{ role: 'user', content: xmlContent }],
        max_tokens: 8000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error(`[distill] API error ${response.status} for cluster merge`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawContent: string = data?.choices?.[0]?.message?.content ?? '';

    const merged = parseDistillResponse(rawContent);
    return merged.length > 0 ? merged : null;
  } catch (err) {
    console.error(
      '[distill] API call failed:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main distill function
// ---------------------------------------------------------------------------

/**
 * Distill pipeline stage.
 *
 * Deduplicates and merges similar IdeaBlocks by:
 *   1. Computing pairwise Jaccard similarity (keywords, entities, tags)
 *   2. Finding connected components (clusters) above the similarity threshold
 *   3. Merging each cluster via the Blockify distill API
 */
export async function distill(
  blocks: IdeaBlock[],
  config: PipelineConfig,
): Promise<DistillResult> {
  const originalCount = blocks.length;

  // Guard: API key required for distillation
  if (!config.blockifyApiKey) {
    console.warn('[distill] WARNING: blockifyApiKey is empty — skipping distillation');
    return {
      blocks,
      merges: [],
      originalCount,
      finalCount: originalCount,
      reductionPercent: 0,
    };
  }

  if (blocks.length === 0) {
    console.log('[distill] No blocks to distill.');
    return {
      blocks: [],
      merges: [],
      originalCount: 0,
      finalCount: 0,
      reductionPercent: 0,
    };
  }

  // -------------------------------------------------------------------------
  // Step 1 & 2: Compute pairwise similarity and find clusters
  // -------------------------------------------------------------------------

  console.log(`[distill] Computing pairwise similarity for ${blocks.length} blocks...`);
  const clusters = findClusters(blocks, config.similarityThreshold);

  const multiBlockClusters = clusters.filter((c) => c.length >= 2);
  const singletonClusters = clusters.filter((c) => c.length === 1);

  console.log(`[distill] Found ${multiBlockClusters.length} clusters of similar blocks`);
  console.log(`[distill] ${singletonClusters.length} singleton blocks (no similar pairs)`);

  // -------------------------------------------------------------------------
  // Step 3: Merge clusters via Blockify distill API
  // -------------------------------------------------------------------------

  const mergedBlocks: IdeaBlock[] = [];
  const mergeRecords: MergeRecord[] = [];

  // Singleton blocks pass through unchanged
  for (const cluster of singletonClusters) {
    mergedBlocks.push(blocks[cluster[0]]);
  }

  // Multi-block clusters get merged via API
  for (const cluster of multiBlockClusters) {
    const clusterBlocks = cluster.map((idx) => blocks[idx]);
    const originalIds = clusterBlocks.map((b) => b.id);

    console.log(`[distill] Merging cluster of ${clusterBlocks.length} blocks...`);

    // If cluster exceeds maxBlocksPerDistillCall, split into sub-clusters
    if (clusterBlocks.length <= config.maxBlocksPerDistillCall) {
      const result = await callBlockifyDistill(clusterBlocks, config);

      if (result) {
        // Mark merged blocks
        for (const block of result) {
          block.blockType = 'merged';
          block.distilled = true;
        }
        mergedBlocks.push(...result);

        for (const mergedBlock of result) {
          mergeRecords.push({
            originalIds,
            mergedBlock,
          });
        }
      } else {
        // API failed — keep original blocks for this cluster
        console.warn(
          `[distill] API merge failed for cluster of ${clusterBlocks.length} blocks — keeping originals`,
        );
        mergedBlocks.push(...clusterBlocks);
      }
    } else {
      // Split large cluster into sub-clusters of maxBlocksPerDistillCall
      for (let i = 0; i < clusterBlocks.length; i += config.maxBlocksPerDistillCall) {
        const subCluster = clusterBlocks.slice(i, i + config.maxBlocksPerDistillCall);
        const subIds = subCluster.map((b) => b.id);

        console.log(
          `[distill]   Sub-cluster: ${subCluster.length} blocks (${i + 1}-${Math.min(i + config.maxBlocksPerDistillCall, clusterBlocks.length)} of ${clusterBlocks.length})`,
        );

        const result = await callBlockifyDistill(subCluster, config);

        if (result) {
          for (const block of result) {
            block.blockType = 'merged';
            block.distilled = true;
          }
          mergedBlocks.push(...result);

          for (const mergedBlock of result) {
            mergeRecords.push({
              originalIds: subIds,
              mergedBlock,
            });
          }
        } else {
          console.warn(
            `[distill] API merge failed for sub-cluster — keeping originals`,
          );
          mergedBlocks.push(...subCluster);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Build result and persist
  // -------------------------------------------------------------------------

  const finalCount = mergedBlocks.length;
  const reductionPercent =
    originalCount > 0 ? Math.round(((originalCount - finalCount) / originalCount) * 100) : 0;

  console.log(
    `[distill] Reduction: ${originalCount} blocks -> ${finalCount} blocks (${reductionPercent}% reduction)`,
  );

  // Save distilled blocks to disk
  await fs.mkdir(config.ideablocksDir, { recursive: true });
  const outputPath = path.join(config.ideablocksDir, 'blocks-distilled.json');
  await fs.writeFile(outputPath, JSON.stringify(mergedBlocks, null, 2));
  console.log(`[distill] Saved ${finalCount} distilled blocks to ${outputPath}`);

  return {
    blocks: mergedBlocks,
    merges: mergeRecords,
    originalCount,
    finalCount,
    reductionPercent,
  };
}
