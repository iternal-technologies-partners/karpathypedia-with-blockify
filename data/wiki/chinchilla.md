---
title: "Chinchilla"
slug: "chinchilla"
summary: "Training data is arguably the most critical factor in LLM performance. Modern LLMs are trained on trillions of tokens from diverse sources: web crawls (Common Crawl), books, academic papers, code repositories (GitHub), Wikipedia, and curated datasets. Data quality affects models through several mech"
category: "Concepts"
tags:
  - "CONCEPT"
  - "IMPORTANT"
  - "DATA_PROCESSING"
  - "AI"
relatedSlugs:
ideablockIds:
  - "ib_2c5a7e9f1b3d60e4"
lastUpdated: "2026-04-05"
wordCount: 249
---

Training data is arguably the most critical factor in LLM performance. Modern LLMs are trained on trillions of tokens from diverse sources: web crawls (Common Crawl), books, academic papers, code repositories (GitHub), Wikipedia, and curated datasets. Data quality affects models through several mech

### How does training data quality and composition affect large language model performance?

Training data is arguably the most critical factor in LLM performance. Modern LLMs are trained on trillions of tokens from diverse sources: web crawls (Common Crawl), books, academic papers, code repositories (GitHub), Wikipedia, and curated datasets. Data quality affects models through several mechanisms: (1) Data composition determines what knowledge and capabilities the model acquires — models trained heavily on code (like Codex) excel at programming, while those trained on scientific papers perform better on technical reasoning; (2) Data cleaning and deduplication are essential, as Hernandez et al. (2022) showed that duplicate data causes memorization and degrades generalization; (3) Filtering for quality (using heuristics or classifier-based filtering as in GPT-3's WebText approach) significantly improves output quality; (4) Data recency determines the knowledge cutoff — models cannot know about events after their training data ends; (5) Benchmark contamination, where test set data leaks into training data, can inflate evaluation metrics. The Chinchilla scaling laws (Hoffmann et al., 2022) demonstrated that many LLMs were undertrained relative to their size, suggesting that more data (not just more parameters) yields better performance per compute dollar.

**Keywords:** training data, data quality, deduplication, Common Crawl, Chinchilla, scaling laws, data composition
