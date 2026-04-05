---
title: "Transformer Architecture"
slug: "transformer-architecture"
summary: "The transformer is a neural network architecture introduced in 2017 that uses self-attention mechanisms to process sequences in parallel, replacing recurrent models and enabling the scaling revolution behind modern large language models."
category: "Architecture"
tags: ["TRANSFORMER", "ATTENTION", "ARCHITECTURE", "DEEP_LEARNING"]
relatedSlugs: ["large-language-models", "neural-network-fundamentals", "tokenization-and-embeddings"]
ideablockIds: ["ib_a3f7c91e2d4b08a1", "ib_b8e2d04f6a1c73e9", "ib_8c1a3e5f7b9d26ea"]
lastUpdated: "2025-03-15"
---

The transformer is a deep learning architecture introduced by Vaswani et al. in the 2017 paper "Attention Is All You Need." It fundamentally changed the field of natural language processing and, subsequently, nearly all areas of deep learning by demonstrating that models based entirely on attention mechanisms could outperform recurrent and convolutional architectures on sequence-to-sequence tasks. The transformer's ability to process all positions in a sequence simultaneously, rather than step-by-step, unlocked unprecedented training parallelism and made possible the era of [large language models](/wiki/large-language-models).

## Architecture Overview

The original transformer follows an encoder-decoder design. The encoder maps an input sequence of token representations to a sequence of continuous representations, which the decoder then uses to generate an output sequence one token at a time. Both the encoder and decoder are composed of stacked identical layers. Each encoder layer contains two sub-layers: a multi-head self-attention mechanism and a position-wise feed-forward network. Each decoder layer adds a third sub-layer that performs multi-head attention over the encoder's output. Residual connections and layer normalization surround each sub-layer, stabilizing training and enabling gradient flow through deep stacks.

## Self-Attention Mechanism

The core innovation of the transformer is scaled dot-product attention. For each token in the input, the model computes three vectors through learned linear projections: a query (Q), a key (K), and a value (V). Attention scores are computed as the dot product of queries with keys, scaled by the square root of the key dimension to prevent gradient instability in the softmax function. The resulting weights determine how much each token attends to every other token, and these weights are applied to the value vectors to produce the output.

Multi-head attention extends this by running multiple attention computations in parallel with different learned projections. Each "head" can learn to focus on different types of relationships — one head might capture syntactic dependencies while another captures semantic similarity. The outputs of all heads are concatenated and linearly projected to produce the final attention output.

## Positional Encoding

Because the self-attention mechanism treats its input as an unordered set, transformers require explicit positional information. The original architecture used fixed sinusoidal encodings that assign each position a unique pattern across dimensions. Modern variants have introduced learned absolute embeddings, Rotary Position Embeddings (RoPE), and Attention with Linear Biases (ALiBi), each with different tradeoffs for sequence length generalization and computational efficiency.

## Impact and Variants

The transformer spawned two dominant paradigms. Encoder-only models like BERT use bidirectional attention for understanding tasks such as classification and named entity recognition. Decoder-only models like the [GPT series](/wiki/large-language-models) use causal (masked) attention for generative tasks and have become the foundation for modern conversational AI. Encoder-decoder models like T5 maintain the original architecture for tasks requiring both comprehension and generation.

The architecture's scalability has proven remarkable. From the original 65-million-parameter model to systems exceeding one trillion parameters, transformers have consistently improved with scale in ways that earlier architectures could not. This scalability, combined with efficient hardware utilization through parallelism, established the transformer as the dominant architecture in modern AI.

## Key Properties

Transformers exhibit several properties that distinguish them from prior architectures. Their O(n^2) attention complexity with respect to sequence length means that processing long sequences is expensive, motivating research into efficient attention variants such as FlashAttention, sparse attention, and linear attention. However, the quadratic cost is offset by massive parallelism during training — unlike [recurrent networks](/wiki/neural-network-fundamentals), which must process tokens sequentially, transformers process all tokens simultaneously.

The architecture also enables effective transfer learning: a transformer pre-trained on a large corpus captures general linguistic knowledge that can be adapted to specific tasks through [fine-tuning](/wiki/large-language-models), making it practical to achieve strong performance on tasks with limited labeled data.

## See Also

- [Large Language Models](/wiki/large-language-models) — How transformers scaled to produce modern AI systems
- [Neural Network Fundamentals](/wiki/neural-network-fundamentals) — The foundational concepts underlying transformer components
- [Tokenization and Embeddings](/wiki/tokenization-and-embeddings) — How text is converted into the representations transformers process
- [Retrieval-Augmented Generation](/wiki/retrieval-augmented-generation) — How transformer-based models are enhanced with external knowledge
