---
title: "Large Language Models"
slug: "large-language-models"
summary: "Large language models (LLMs) are transformer-based neural networks with billions of parameters, trained on massive text corpora to predict tokens, exhibiting emergent capabilities such as in-context learning, reasoning, and instruction following at sufficient scale."
category: "Architecture"
tags: ["LLM", "GPT", "SCALING", "DEEP_LEARNING", "GENERATIVE_AI"]
relatedSlugs: ["transformer-architecture", "neural-network-fundamentals", "retrieval-augmented-generation", "tokenization-and-embeddings"]
ideablockIds: ["ib_c5a1f38d9e7b24c6", "ib_d9f4e27b3c8a15d0", "ib_3d6b8f0a2c4e71f5", "ib_2c5a7e9f1b3d60e4"]
lastUpdated: "2025-03-15"
---

Large language models (LLMs) are neural networks, predominantly based on the [transformer architecture](/wiki/transformer-architecture), that have been trained on vast quantities of text data to model the statistical distribution of language. Their defining characteristic is scale: modern LLMs contain billions to over a trillion parameters and are trained on trillions of [tokens](/wiki/tokenization-and-embeddings) drawn from internet text, books, code repositories, and curated datasets. This scale gives rise to emergent capabilities not present in smaller models, including in-context learning, chain-of-thought reasoning, and the ability to follow complex instructions.

## The GPT Paradigm

The Generative Pre-trained Transformer (GPT) series, developed by OpenAI, established the dominant paradigm for modern LLMs. GPT models use only the decoder portion of the original transformer, employing causal (masked) self-attention so that each token can only attend to previous tokens in the sequence. This autoregressive design enables next-token prediction: given a sequence of tokens, the model outputs a probability distribution over the vocabulary for the next token.

GPT's training follows a two-phase approach introduced by Radford et al. (2018): unsupervised pre-training on a large corpus using the language modeling objective, followed by task-specific adaptation. GPT-2 demonstrated that scaling this approach produced a model capable of coherent long-form text generation and zero-shot task transfer. GPT-3, with 175 billion parameters, revealed that few-shot learning through in-context examples emerged at scale without any gradient updates. GPT-4 extended capabilities to multimodal inputs and demonstrated reasoning abilities that approached human performance on many academic benchmarks.

## Scaling Laws

The empirical scaling laws discovered by Kaplan et al. (2020) showed that model performance (measured as cross-entropy loss) improves predictably as a power law with increases in model size, dataset size, and training compute. These laws provided a quantitative framework for deciding how to allocate training resources. The Chinchilla scaling analysis (Hoffmann et al., 2022) refined these findings, demonstrating that many existing LLMs were significantly undertrained — trained on too little data relative to their parameter count. Chinchilla showed that a 70B-parameter model trained on 1.4 trillion tokens outperformed the 175B-parameter Gopher trained on 300 billion tokens, suggesting that data scaling is at least as important as parameter scaling.

## Training Pipeline

Training an LLM involves multiple stages. Pre-training on a large, diverse text corpus teaches the model general language understanding and world knowledge through next-token prediction. This is the most compute-intensive phase, often requiring thousands of GPUs running for weeks or months. Training data quality is critical — deduplication, filtering for quality, and careful composition of the data mixture significantly affect model capabilities.

After pre-training, models undergo alignment through supervised fine-tuning (SFT) on instruction-response pairs, teaching the model to follow human instructions. Reinforcement learning from human feedback (RLHF) or direct preference optimization (DPO) further refines the model's outputs to be helpful, harmless, and honest. Parameter-efficient fine-tuning methods like LoRA and QLoRA enable adaptation on consumer hardware by training small low-rank update matrices while keeping the base model frozen.

## Emergent Capabilities

Perhaps the most striking aspect of LLMs is the emergence of capabilities that were not explicitly trained for and that appear only at sufficient scale. These include the ability to perform arithmetic, translate between languages not heavily represented in training data, write and debug code, and reason about novel scenarios through chain-of-thought prompting. The nature and reliability of these emergent capabilities remain active areas of research, with some researchers arguing that apparent emergence may be an artifact of evaluation metric choice rather than a sharp phase transition.

## Limitations and Challenges

Despite their capabilities, LLMs face fundamental limitations. They can hallucinate — generating confident but factually incorrect information — because they model statistical patterns rather than maintaining a verified knowledge base. Their knowledge is frozen at training time, making them unable to reflect recent events without [retrieval augmentation](/wiki/retrieval-augmented-generation). Context windows, while expanding rapidly (from 2K tokens in GPT-2 to over 1M tokens in some modern models), still impose practical limits on the information the model can consider at once. Inference costs scale linearly with sequence length and model size, making deployment at scale expensive.

## See Also

- [Transformer Architecture](/wiki/transformer-architecture) — The foundational architecture underlying all modern LLMs
- [Retrieval-Augmented Generation](/wiki/retrieval-augmented-generation) — Techniques for augmenting LLMs with external knowledge
- [Neural Network Fundamentals](/wiki/neural-network-fundamentals) — Core concepts of the neural networks that compose LLMs
- [Tokenization and Embeddings](/wiki/tokenization-and-embeddings) — How text is processed into the representations LLMs work with
