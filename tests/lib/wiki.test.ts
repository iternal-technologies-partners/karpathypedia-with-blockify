/**
 * Tests for wiki article management functions.
 */
import { getArticleBySlug, getAllArticles, getArticlesByCategory, getCategories, getWikiIndex } from '@/lib/wiki';

describe('getAllArticles', () => {
  it('should return an array of article metadata', async () => {
    const articles = await getAllArticles();
    expect(Array.isArray(articles)).toBe(true);
  });

  it('should return articles with required fields', async () => {
    const articles = await getAllArticles();
    if (articles.length > 0) {
      const article = articles[0];
      expect(article.slug).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.summary).toBeDefined();
      expect(article.category).toBeDefined();
      expect(article.tags).toBeInstanceOf(Array);
      expect(typeof article.wordCount).toBe('number');
      expect(article.lastUpdated).toBeDefined();
    }
  });
});

describe('getArticleBySlug', () => {
  it('should return null for non-existent slug', async () => {
    const article = await getArticleBySlug('this-article-does-not-exist');
    expect(article).toBeNull();
  });

  it('should return a full article for an existing slug', async () => {
    const article = await getArticleBySlug('transformer-architecture');
    if (article) {
      expect(article.title).toBeDefined();
      expect(article.content).toBeDefined();
      expect(article.slug).toBe('transformer-architecture');
      expect(typeof article.wordCount).toBe('number');
      expect(article.wordCount).toBeGreaterThan(0);
    }
  });
});

describe('getArticlesByCategory', () => {
  it('should return articles for a known category', async () => {
    const articles = await getArticlesByCategory('Architecture');
    expect(Array.isArray(articles)).toBe(true);
    for (const article of articles) {
      expect(article.category).toBe('Architecture');
    }
  });

  it('should return empty array for unknown category', async () => {
    const articles = await getArticlesByCategory('UnknownCategory12345');
    expect(articles).toEqual([]);
  });
});

describe('getCategories', () => {
  it('should return an array of category metadata', async () => {
    const categories = await getCategories();
    expect(Array.isArray(categories)).toBe(true);
    if (categories.length > 0) {
      expect(categories[0].name).toBeDefined();
      expect(categories[0].slug).toBeDefined();
      expect(typeof categories[0].articleCount).toBe('number');
    }
  });
});

describe('getWikiIndex', () => {
  it('should return a valid wiki index', async () => {
    const index = await getWikiIndex();
    if (index) {
      expect(index.articles).toBeInstanceOf(Array);
      expect(index.categories).toBeInstanceOf(Array);
      expect(typeof index.totalArticles).toBe('number');
      expect(typeof index.totalIdeaBlocks).toBe('number');
    }
  });
});
