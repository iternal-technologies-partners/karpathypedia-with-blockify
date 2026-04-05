---
title: "Tokenization and Embeddings"
slug: "tokenization-and-embeddings"
summary: "Tokenization converts raw text into discrete integer tokens using subword algorithms like BPE, while embedding layers map these tokens into dense vector representations in high-dimensional space where geometric relationships encode semantic meaning."
category: "Data Processing"
tags: ["TOKENIZATION", "EMBEDDINGS", "BPE", "DATA_PROCESSING", "NLP"]
relatedSlugs: ["transformer-architecture", "large-language-models", "neural-network-fundamentals", "retrieval-augmented-generation"]
ideablockIds: ["ib_0a3e5c7d9f2b48c1", "ib_1b4f6d8e0a2c59d3"]
lastUpdated: "2025-03-15"
---

Tokenization and embeddings are the two foundational processes that convert human-readable text into the numerical representations that [neural networks](/wiki/neural-network-fundamentals) can process. Tokenization breaks text into discrete units (tokens) and assigns each an integer identifier, while embedding layers transform these integers into dense, continuous vectors in high-dimensional space. Together, they form the input pipeline for all modern [language models](/wiki/large-language-models), and their design choices profoundly affect model capabilities, efficiency, and limitations.

## Tokenization

Modern language models use subword tokenization algorithms that split text into units between individual characters and whole words. This approach balances vocabulary size against sequence length: common words remain single tokens for efficiency, while rare or unknown words are decomposed into recognizable subword pieces.

Byte Pair Encoding (BPE), the most widely used algorithm, works by iteratively merging the most frequent pair of adjacent tokens in a training corpus. Starting from a character-level vocabulary, BPE builds up to a target vocabulary size (typically 32,000 to 100,000 tokens) by repeatedly identifying and merging the most common adjacent pair. The result is a vocabulary where frequent words like "the" are single tokens, while less common words like "tokenization" might be split into "token" + "ization."

WordPiece, used in BERT, takes a similar approach but selects merges based on likelihood improvement rather than raw frequency. SentencePiece treats the input as a raw byte stream (including whitespace) and can be applied to any language without pre-tokenization rules, making it particularly suited for multilingual models. The tiktoken library used by OpenAI implements a byte-level BPE that operates directly on UTF-8 bytes.

## Tokenization's Impact on Model Behavior

Tokenization choices have far-reaching effects that are often underappreciated. The vocabulary size determines how many tokens are needed to represent a given text, directly affecting compute costs and context window utilization — a model with a 128K-token context window can process more text if its tokenizer is more efficient. Multilingual capability depends on the tokenizer's coverage of different scripts; tokenizers trained primarily on English text may require many tokens to represent the same content in languages like Chinese or Arabic, effectively reducing their context capacity for those languages.

Tokenization artifacts can cause surprising model failures. Because tokens are the atomic units of the model's world, tasks that require reasoning below the token level — such as counting characters, reversing strings, or performing arithmetic — can be difficult. A number like "1234" might be a single token, making it opaque to character-level operations. Andrej Karpathy's detailed lecture on tokenization highlights these issues, demonstrating how tokenizer design is "the bane of LLMs" and a source of many counterintuitive failure modes.

## Embeddings

Once text is tokenized, each token ID is mapped to a dense vector through an embedding layer — essentially a learned lookup table of shape (vocabulary_size, d_model), where d_model is the model's hidden dimension (e.g., 768 for BERT-base, 4096 for LLaMA-7B, 12288 for GPT-3). These vectors are initialized randomly and learned during training, converging to representations where geometric relationships encode semantic relationships.

The landmark Word2Vec work by Mikolov et al. (2013) demonstrated that learned embeddings capture meaningful analogies: the vector operation "king" - "man" + "woman" produces a vector close to "queen." While modern [transformer](/wiki/transformer-architecture) embeddings are more contextualized (a word's representation depends on its surrounding context), the principle that proximity in vector space corresponds to semantic similarity remains fundamental.

## Positional Information

Because the [self-attention mechanism](/wiki/transformer-architecture) is permutation-invariant, transformers require explicit positional information added to token embeddings. The original transformer used fixed sinusoidal encodings, while models like GPT-2 use learned absolute positional embeddings. Modern architectures increasingly use Rotary Position Embeddings (RoPE), which encode position by rotating embedding vectors in paired dimensions, naturally representing relative position in the attention computation and enabling better generalization to longer sequences.

## Sentence and Document Embeddings

Beyond token-level embeddings, specialized models produce fixed-size vector representations of entire sentences or documents. Models like BERT, sentence-transformers (SBERT), and newer embedding models (E5, GTE, Nomic) generate embeddings optimized for semantic similarity comparison via cosine similarity or dot product. These document-level embeddings are the backbone of [retrieval-augmented generation](/wiki/retrieval-augmented-generation) systems, semantic search engines, and clustering applications.

The quality of these embeddings is evaluated on benchmarks like MTEB (Massive Text Embedding Benchmark), which tests performance across retrieval, classification, clustering, and semantic similarity tasks. State-of-the-art embedding models are typically transformer-based encoders trained with contrastive learning objectives that push similar texts together and dissimilar texts apart in the embedding space.

## See Also

- [Transformer Architecture](/wiki/transformer-architecture) — The architecture that processes these token representations
- [Large Language Models](/wiki/large-language-models) — Models that operate on tokenized and embedded text
- [Neural Network Fundamentals](/wiki/neural-network-fundamentals) — The mathematical foundations of embedding layers
- [Retrieval-Augmented Generation](/wiki/retrieval-augmented-generation) — Systems that rely on embeddings for semantic search
