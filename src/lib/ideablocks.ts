/**
 * IdeaBlock management
 *
 * Reads IdeaBlock JSON data from data/ideablocks/.
 * Supports both a single blocks.json array and individual {id}.json files.
 */

import fs from 'fs/promises';
import path from 'path';
import type { IdeaBlock } from './types';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const BLOCKS_DIR = () => path.join(process.cwd(), 'data', 'ideablocks');

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

/**
 * Internal loader — reads all blocks from disk, merging the consolidated
 * blocks.json (if present) with any individual JSON files.
 */
async function loadAllBlocks(): Promise<IdeaBlock[]> {
  const dir = BLOCKS_DIR();

  if (!(await pathExists(dir))) {
    return [];
  }

  const blocks: IdeaBlock[] = [];
  const seenIds = new Set<string>();

  // 1. Try the consolidated blocks.json first
  const consolidatedPath = path.join(dir, 'blocks.json');
  if (await pathExists(consolidatedPath)) {
    const raw = await fs.readFile(consolidatedPath, 'utf-8');
    const parsed: IdeaBlock[] = JSON.parse(raw);
    for (const block of parsed) {
      if (!seenIds.has(block.id)) {
        seenIds.add(block.id);
        blocks.push(block);
      }
    }
  }

  // 2. Scan for individual JSON files (skip blocks.json)
  const entries = await fs.readdir(dir);
  const jsonFiles = entries.filter(
    (f) => f.endsWith('.json') && f !== 'blocks.json',
  );

  for (const file of jsonFiles) {
    const filePath = path.join(dir, file);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Support both single-object and array formats
    const items: IdeaBlock[] = Array.isArray(parsed) ? parsed : [parsed];
    for (const block of items) {
      if (!seenIds.has(block.id)) {
        seenIds.add(block.id);
        blocks.push(block);
      }
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return every IdeaBlock on disk.
 */
export async function getAllIdeaBlocks(): Promise<IdeaBlock[]> {
  return loadAllBlocks();
}

/**
 * Find a single IdeaBlock by its id.
 */
export async function getIdeaBlockById(
  id: string,
): Promise<IdeaBlock | null> {
  const dir = BLOCKS_DIR();

  // Fast path: check for an individual file named {id}.json
  const individualPath = path.join(dir, `${id}.json`);
  if (await pathExists(individualPath)) {
    const raw = await fs.readFile(individualPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const block: IdeaBlock = Array.isArray(parsed) ? parsed[0] : parsed;
    if (block && block.id === id) {
      return block;
    }
  }

  // Slow path: scan all blocks
  const all = await loadAllBlocks();
  return all.find((b) => b.id === id) ?? null;
}

/**
 * Retrieve multiple IdeaBlocks by their ids (preserves order).
 */
export async function getIdeaBlocksByIds(
  ids: string[],
): Promise<IdeaBlock[]> {
  const all = await loadAllBlocks();
  const map = new Map(all.map((b) => [b.id, b]));
  return ids.map((id) => map.get(id)).filter(Boolean) as IdeaBlock[];
}

/**
 * Find all IdeaBlocks containing a specific tag.
 */
export async function getIdeaBlocksByTag(tag: string): Promise<IdeaBlock[]> {
  const all = await loadAllBlocks();
  const lowerTag = tag.toLowerCase();
  return all.filter((b) =>
    b.tags.some((t) => t.toLowerCase() === lowerTag),
  );
}

/**
 * Find all IdeaBlocks that reference a given entity name.
 */
export async function getIdeaBlocksByEntity(
  entityName: string,
): Promise<IdeaBlock[]> {
  const all = await loadAllBlocks();
  const lowerName = entityName.toLowerCase();
  return all.filter((b) =>
    b.entities.some((e) => e.name.toLowerCase() === lowerName),
  );
}

/**
 * Aggregate statistics about the IdeaBlock corpus.
 */
export async function getIdeaBlockStats(): Promise<{
  total: number;
  raw: number;
  distilled: number;
  tags: Record<string, number>;
}> {
  const all = await loadAllBlocks();

  const tagCounts: Record<string, number> = {};
  let raw = 0;
  let distilled = 0;

  for (const block of all) {
    if (block.blockType === 'raw') raw += 1;
    if (block.distilled) distilled += 1;

    for (const tag of block.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  return {
    total: all.length,
    raw,
    distilled,
    tags: tagCounts,
  };
}
