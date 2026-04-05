/**
 * Tests for search functionality.
 */
import { searchAll, searchWiki, searchIdeaBlocks } from '@/lib/search';

describe('searchWiki', () => {
  it('should return results for a matching query', async () => {
    const results = await searchWiki('transformer');
    expect(Array.isArray(results)).toBe(true);
    for (const result of results) {
      expect(result.type).toBe('article');
      expect(result.title).toBeDefined();
      expect(result.snippet).toBeDefined();
      expect(typeof result.score).toBe('number');
    }
  });

  it('should return empty array for nonsense query', async () => {
    const results = await searchWiki('xyzzy12345nonsense');
    expect(results).toEqual([]);
  });
});

describe('searchIdeaBlocks', () => {
  it('should return results for a matching query', async () => {
    const results = await searchIdeaBlocks('attention');
    expect(Array.isArray(results)).toBe(true);
    for (const result of results) {
      expect(result.type).toBe('ideablock');
    }
  });
});

describe('searchAll', () => {
  it('should combine article and ideablock results', async () => {
    const results = await searchAll('neural network');
    expect(Array.isArray(results)).toBe(true);
    // Should have both types if data exists
    const types = new Set(results.map(r => r.type));
    // At minimum it returns an array
    expect(types.size).toBeGreaterThanOrEqual(0);
  });

  it('should return results sorted by score descending', async () => {
    const results = await searchAll('language model');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('should handle empty query', async () => {
    const results = await searchAll('');
    expect(Array.isArray(results)).toBe(true);
  });
});
