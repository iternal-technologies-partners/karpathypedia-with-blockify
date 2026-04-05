---
title: "Cosine Similarity"
slug: "cosine-similarity"
summary: "Embeddings are dense, continuous vector representations of discrete objects (words, tokens, sentences, or documents) in a high-dimensional space, where geometric relationships encode semantic meaning. In language models, a token embedding is a learned lookup table that maps each token ID to a vector"
category: "Concepts"
tags:
  - "CONCEPT"
  - "DETAILED"
  - "DATA_PROCESSING"
  - "AI"
relatedSlugs:
ideablockIds:
  - "ib_1b4f6d8e0a2c59d3"
lastUpdated: "2026-04-05"
wordCount: 218
---

Embeddings are dense, continuous vector representations of discrete objects (words, tokens, sentences, or documents) in a high-dimensional space, where geometric relationships encode semantic meaning. In language models, a token embedding is a learned lookup table that maps each token ID to a vector

### What are embeddings and how do they represent meaning in vector space?

Embeddings are dense, continuous vector representations of discrete objects (words, tokens, sentences, or documents) in a high-dimensional space, where geometric relationships encode semantic meaning. In language models, a token embedding is a learned lookup table that maps each token ID to a vector of dimension d_model (e.g., 768 or 4096 dimensions). These vectors are learned during training such that semantically similar tokens end up close together in the vector space, and meaningful arithmetic relationships emerge (e.g., king - man + woman ≈ queen). Transformers also use positional embeddings to encode sequence order, since the self-attention mechanism is permutation-invariant. Beyond token-level embeddings, sentence and document embeddings (produced by encoder models like BERT or specialized models like E5 and GTE) enable semantic search by allowing comparison of texts via cosine similarity or dot product in embedding space. The quality of embeddings is fundamental to retrieval-augmented generation, semantic search, clustering, and classification tasks.

**Keywords:** embeddings, vector space, semantic similarity, positional embedding, cosine similarity, dense representation
