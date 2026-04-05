---
title: "Multi-head Attention"
slug: "multi-head-attention"
summary: "Self-attention (also called scaled dot-product attention) computes a weighted sum of value vectors, where the weight assigned to each value is determined by the compatibility of the corresponding query and key vectors. For each input token, three vectors are derived via learned linear projections: a"
category: "Concepts"
tags:
  - "TECHNOLOGY"
  - "DETAILED"
  - "AI"
  - "MECHANISM"
relatedSlugs:
ideablockIds:
  - "ib_b8e2d04f6a1c73e9"
lastUpdated: "2026-04-05"
wordCount: 205
---

Self-attention (also called scaled dot-product attention) computes a weighted sum of value vectors, where the weight assigned to each value is determined by the compatibility of the corresponding query and key vectors. For each input token, three vectors are derived via learned linear projections: a

### How does the self-attention mechanism work in transformers?

Self-attention (also called scaled dot-product attention) computes a weighted sum of value vectors, where the weight assigned to each value is determined by the compatibility of the corresponding query and key vectors. For each input token, three vectors are derived via learned linear projections: a query (Q), a key (K), and a value (V). The attention score between two positions is the dot product of the query at one position with the key at another, scaled by the square root of the key dimension (sqrt(d_k)) to prevent gradient vanishing in softmax. These scores are passed through softmax to produce weights, which are then used to compute a weighted sum of value vectors. Multi-head attention runs this process in parallel across multiple 'heads' with different learned projections, allowing the model to attend to information from different representation subspaces at different positions simultaneously.

**Keywords:** self-attention, query, key, value, dot product, multi-head, scaled dot-product
