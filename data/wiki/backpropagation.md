---
title: "Backpropagation"
slug: "backpropagation"
summary: "Backpropagation (backward propagation of errors) is the algorithm used to compute gradients of the loss function with respect to each weight in a neural network, enabling gradient-based optimization. It applies the chain rule of calculus in reverse through the computational graph: starting from the "
category: "General"
tags:
  - "CONCEPT"
  - "IMPORTANT"
  - "FOUNDATIONS"
  - "AI"
relatedSlugs:
ideablockIds:
  - "ib_e2c7a58f1d3b96e4"
lastUpdated: "2026-04-05"
wordCount: 217
---

Backpropagation (backward propagation of errors) is the algorithm used to compute gradients of the loss function with respect to each weight in a neural network, enabling gradient-based optimization. It applies the chain rule of calculus in reverse through the computational graph: starting from the 

### What is backpropagation and why is it fundamental to training neural networks?

Backpropagation (backward propagation of errors) is the algorithm used to compute gradients of the loss function with respect to each weight in a neural network, enabling gradient-based optimization. It applies the chain rule of calculus in reverse through the computational graph: starting from the loss at the output layer, it propagates error signals backward through each layer, computing partial derivatives at each node. For a network with L layers, the gradient at layer l depends on the gradients from layer l+1 multiplied by the local derivatives (activations and weights) at layer l. Combined with an optimizer like stochastic gradient descent (SGD) or Adam, these gradients are used to update weights in the direction that minimizes the loss. Backpropagation's efficiency — computing all gradients in a single backward pass with cost proportional to the forward pass — is what makes training deep networks with millions or billions of parameters computationally feasible.

**Keywords:** backpropagation, gradient, chain rule, loss function, SGD, Adam, optimization
