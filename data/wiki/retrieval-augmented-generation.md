---
title: "Retrieval-Augmented Generation"
slug: "retrieval-augmented-generation"
summary: "Retrieval-Augmented Generation (RAG) is a technique that enhances large language model outputs by retrieving relevant documents from external knowledge bases and incorporating them into the generation context, reducing hallucination and enabling access to current, verifiable information."
category: "Applications"
tags: ["RAG", "RETRIEVAL", "GENERATION", "VECTOR_DATABASE", "APPLICATIONS"]
relatedSlugs: ["large-language-models", "tokenization-and-embeddings", "transformer-architecture"]
ideablockIds: ["ib_4e7c9a1b3d5f82a6", "ib_1b4f6d8e0a2c59d3", "ib_6a9e1c3d5f7b04c8"]
lastUpdated: "2025-03-15"
---

Retrieval-Augmented Generation (RAG) is a hybrid AI technique that combines the generative capabilities of [large language models](/wiki/large-language-models) with information retrieval systems to produce responses grounded in specific, verifiable source documents. Introduced by Lewis et al. in 2020, RAG addresses several fundamental limitations of standalone LLMs: their tendency to hallucinate plausible but incorrect information, their inability to access knowledge beyond their training data cutoff, and the difficulty of attributing their outputs to specific sources.

## Core Architecture

A RAG system operates through a pipeline of four stages: indexing, retrieval, augmentation, and generation. During indexing, source documents are split into chunks (typically 256-1024 tokens), each chunk is converted to a dense vector representation using an [embedding model](/wiki/tokenization-and-embeddings), and these vectors are stored in a vector database such as Pinecone, Weaviate, Chroma, or Qdrant. During retrieval, the user's query is embedded using the same model and compared against stored vectors via approximate nearest neighbor search to find the k most semantically similar chunks. These retrieved chunks are then inserted into the LLM's prompt as context (augmentation), and the model generates a response conditioned on both the query and the retrieved information (generation).

## Retrieval Strategies

The effectiveness of a RAG system depends heavily on the quality of its retrieval stage. Dense retrieval uses learned [embeddings](/wiki/tokenization-and-embeddings) to capture semantic similarity, enabling the system to find relevant passages even when they use different terminology than the query. Sparse retrieval methods like BM25 use term frequency statistics and are better at exact keyword matching. Hybrid search combines both approaches, typically by computing scores from each method and fusing them with reciprocal rank fusion.

Advanced retrieval techniques further improve quality. Query rewriting uses an LLM to reformulate the user's question into a form more likely to match relevant documents. Hypothetical Document Embeddings (HyDE) generate a hypothetical answer and use its embedding to retrieve real documents. Cross-encoder reranking applies a more computationally expensive model to re-score and reorder the initial retrieval results. Multi-step or recursive retrieval decomposes complex questions into sub-queries, retrieving information for each part before synthesizing a final answer.

## Chunking and Indexing

How documents are chunked before indexing significantly affects retrieval quality. Fixed-size chunking splits text at regular token intervals, while semantic chunking uses natural boundaries like paragraphs or section headers. Recursive character splitting attempts to preserve meaningful units by trying increasingly fine-grained separators. Overlapping chunks ensure that information spanning a chunk boundary is not lost.

Metadata enrichment adds structured information (document title, section heading, date, author) to each chunk, enabling filtered retrieval. Some systems use parent-child relationships, where small chunks are retrieved for precision but the larger parent chunk is passed to the LLM for context. Agentic RAG systems use an LLM to dynamically decide what to retrieve, when, and how, going beyond the simple query-retrieve-generate pipeline.

## Evaluation and Challenges

Evaluating RAG systems requires assessing both retrieval quality and generation quality. Retrieval metrics include recall@k (whether the relevant document appears in the top k results) and mean reciprocal rank. Generation metrics evaluate faithfulness (whether the response is supported by retrieved documents), relevance (whether the response addresses the query), and completeness. Frameworks like RAGAS provide automated evaluation of these dimensions.

Key challenges in RAG include handling conflicting information across sources, managing context window limits when many documents are relevant, maintaining performance as the knowledge base grows, and ensuring the model actually uses the retrieved context rather than relying on its parametric knowledge. The [transformer's](/wiki/transformer-architecture) attention mechanism can struggle to effectively utilize information placed in the middle of long contexts, a phenomenon known as "lost in the middle."

## Applications

RAG has become the standard architecture for enterprise AI applications where accuracy and currency are critical. Common use cases include customer support systems grounded in product documentation, research assistants that synthesize information from scientific papers, legal analysis tools that reference specific statutes and case law, and knowledge management systems that make organizational knowledge accessible through natural language queries. The Karpathypedia system itself uses a RAG-like approach, with [IdeaBlocks](/wiki/large-language-models) serving as pre-distilled knowledge units that provide structured, verified context for article generation.

## See Also

- [Large Language Models](/wiki/large-language-models) — The generative models that RAG systems augment
- [Tokenization and Embeddings](/wiki/tokenization-and-embeddings) — The vector representations that enable semantic retrieval
- [Transformer Architecture](/wiki/transformer-architecture) — The attention-based architecture underlying both retrieval and generation models
