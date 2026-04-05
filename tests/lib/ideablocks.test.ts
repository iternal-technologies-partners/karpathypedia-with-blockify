/**
 * Tests for IdeaBlock data management functions.
 */
import { getAllIdeaBlocks, getIdeaBlockById, getIdeaBlocksByTag, getIdeaBlockStats } from '@/lib/ideablocks';

describe('getAllIdeaBlocks', () => {
  it('should return an array of IdeaBlocks', async () => {
    const blocks = await getAllIdeaBlocks();
    expect(Array.isArray(blocks)).toBe(true);
  });

  it('should return blocks with required fields', async () => {
    const blocks = await getAllIdeaBlocks();
    if (blocks.length > 0) {
      const block = blocks[0];
      expect(block.id).toBeDefined();
      expect(block.name).toBeDefined();
      expect(block.criticalQuestion).toBeDefined();
      expect(block.trustedAnswer).toBeDefined();
      expect(block.tags).toBeInstanceOf(Array);
      expect(block.entities).toBeInstanceOf(Array);
      expect(block.keywords).toBeInstanceOf(Array);
    }
  });
});

describe('getIdeaBlockById', () => {
  it('should return null for non-existent ID', async () => {
    const block = await getIdeaBlockById('non_existent_id');
    expect(block).toBeNull();
  });

  it('should return a block for a valid ID', async () => {
    const blocks = await getAllIdeaBlocks();
    if (blocks.length > 0) {
      const found = await getIdeaBlockById(blocks[0].id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(blocks[0].id);
    }
  });
});

describe('getIdeaBlocksByTag', () => {
  it('should return blocks matching a tag', async () => {
    const blocks = await getIdeaBlocksByTag('TECHNOLOGY');
    expect(Array.isArray(blocks)).toBe(true);
    for (const block of blocks) {
      expect(block.tags.some(t => t.toUpperCase() === 'TECHNOLOGY')).toBe(true);
    }
  });

  it('should return empty array for non-existent tag', async () => {
    const blocks = await getIdeaBlocksByTag('NONEXISTENTTAG12345');
    expect(blocks).toEqual([]);
  });
});

describe('getIdeaBlockStats', () => {
  it('should return stats object with required fields', async () => {
    const stats = await getIdeaBlockStats();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.raw).toBe('number');
    expect(typeof stats.distilled).toBe('number');
    expect(typeof stats.tags).toBe('object');
    expect(stats.total).toBe(stats.raw + stats.distilled);
  });
});
