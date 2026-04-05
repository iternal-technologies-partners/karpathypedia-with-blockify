/**
 * Tests for core type definitions — verifies that sample data conforms to interfaces.
 */
import type { IdeaBlock, Entity, WikiArticle, WikiArticleMeta, CategoryMeta, WikiIndex, SearchResult } from '@/lib/types';

describe('IdeaBlock type', () => {
  const sampleEntity: Entity = {
    name: 'TRANSFORMER',
    type: 'TECHNOLOGY',
  };

  const sampleBlock: IdeaBlock = {
    id: 'ib_abc123def456',
    name: 'Transformer Architecture',
    criticalQuestion: 'What is the transformer architecture?',
    trustedAnswer: 'The transformer is a neural network architecture that uses self-attention.',
    tags: ['TECHNOLOGY', 'IMPORTANT'],
    entities: [sampleEntity],
    keywords: ['transformer', 'attention'],
    sourceDocument: 'paper.pdf',
    blockType: 'distilled',
    createdAt: '2025-01-15T10:30:00Z',
    distilled: true,
  };

  it('should have all required fields', () => {
    expect(sampleBlock.id).toBeDefined();
    expect(sampleBlock.name).toBeDefined();
    expect(sampleBlock.criticalQuestion).toBeDefined();
    expect(sampleBlock.trustedAnswer).toBeDefined();
    expect(sampleBlock.tags).toBeInstanceOf(Array);
    expect(sampleBlock.entities).toBeInstanceOf(Array);
    expect(sampleBlock.keywords).toBeInstanceOf(Array);
    expect(sampleBlock.blockType).toBeDefined();
    expect(sampleBlock.createdAt).toBeDefined();
    expect(typeof sampleBlock.distilled).toBe('boolean');
  });

  it('should have valid entity types', () => {
    const validTypes = ['PRODUCT', 'ORGANIZATION', 'PERSON', 'METRIC', 'TECHNOLOGY', 'CONCEPT', 'LOCATION', 'DATE', 'OTHER'];
    for (const entity of sampleBlock.entities) {
      expect(validTypes).toContain(entity.type);
    }
  });

  it('should have valid block types', () => {
    const validBlockTypes = ['raw', 'distilled', 'merged', 'synthetic'];
    expect(validBlockTypes).toContain(sampleBlock.blockType);
  });
});

describe('WikiArticle type', () => {
  const sampleArticle: WikiArticle = {
    slug: 'transformer-architecture',
    title: 'Transformer Architecture',
    summary: 'Overview of the transformer architecture.',
    content: '# Transformer Architecture\n\nContent here.',
    category: 'Architecture',
    tags: ['TECHNOLOGY'],
    relatedSlugs: ['large-language-models'],
    ideablockIds: ['ib_abc123def456'],
    lastUpdated: '2025-03-15',
    wordCount: 450,
  };

  it('should have all required fields', () => {
    expect(sampleArticle.slug).toBeDefined();
    expect(sampleArticle.title).toBeDefined();
    expect(sampleArticle.content).toBeDefined();
    expect(sampleArticle.category).toBeDefined();
    expect(sampleArticle.tags).toBeInstanceOf(Array);
    expect(sampleArticle.relatedSlugs).toBeInstanceOf(Array);
    expect(sampleArticle.ideablockIds).toBeInstanceOf(Array);
    expect(typeof sampleArticle.wordCount).toBe('number');
  });
});

describe('WikiIndex type', () => {
  const meta: WikiArticleMeta = {
    slug: 'test',
    title: 'Test',
    summary: 'A test article',
    category: 'Testing',
    tags: [],
    wordCount: 100,
    lastUpdated: '2025-01-01',
  };

  const category: CategoryMeta = {
    name: 'Testing',
    slug: 'testing',
    articleCount: 1,
    description: 'Test category',
  };

  const index: WikiIndex = {
    articles: [meta],
    categories: [category],
    lastUpdated: '2025-01-01',
    totalArticles: 1,
    totalIdeaBlocks: 5,
  };

  it('should have articles and categories arrays', () => {
    expect(index.articles).toBeInstanceOf(Array);
    expect(index.categories).toBeInstanceOf(Array);
    expect(index.totalArticles).toBe(1);
    expect(index.totalIdeaBlocks).toBe(5);
  });
});

describe('SearchResult type', () => {
  const result: SearchResult = {
    type: 'article',
    title: 'Test Article',
    snippet: 'A snippet of the article content.',
    slug: 'test-article',
    score: 0.85,
    category: 'Testing',
    tags: ['TEST'],
  };

  it('should have valid type', () => {
    expect(['article', 'ideablock']).toContain(result.type);
  });

  it('should have score between 0 and 1', () => {
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
