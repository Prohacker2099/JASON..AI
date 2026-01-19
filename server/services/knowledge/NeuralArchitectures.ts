export type ArchitectureCategory =
  | 'sequence'
  | 'generative'
  | 'graph'
  | 'recurrent'
  | 'convolutional'
  | 'paradigm'

export type NeuralArchitecture = {
  id: string
  name: string
  category: ArchitectureCategory
  primaryUseCases: string[]
  keyBuildingMethod: string
  description: string
}

export const neuralArchitectures: NeuralArchitecture[] = [
  {
    id: 'transformer',
    name: 'Transformer Networks',
    category: 'sequence',
    primaryUseCases: [
      'Natural Language Processing',
      'Large Language Models (LLMs)',
      'Image Processing',
      'Time Series Analysis',
    ],
    keyBuildingMethod:
      'Self-Attention mechanism that lets each token attend to all others, replacing recurrent connections and enabling massive parallelism.',
    description:
      'Transformers use stacked self-attention and feedforward layers with positional encodings to model long-range dependencies in sequences. They form the basis of modern LLMs and many vision/time-series models.',
  },
  {
    id: 'mamba',
    name: 'Mamba / Selective State Space Models',
    category: 'sequence',
    primaryUseCases: [
      'Fast sequence processing',
      'Long-context modeling',
      'State Space Models (SSMs)',
    ],
    keyBuildingMethod:
      'Selective State Space Model layer that provides linear-time sequence processing, often faster than attention for very long sequences.',
    description:
      'Mamba-style models replace or augment attention with efficient state space layers that retain long-range information while scaling linearly in sequence length, improving speed and memory use on long sequences.',
  },
  {
    id: 'gqa',
    name: 'Grouped-Query Attention (GQA)',
    category: 'sequence',
    primaryUseCases: [
      'LLM inference optimization',
      'Memory-efficient attention in large models',
    ],
    keyBuildingMethod:
      'Multiple attention heads share the same key and value projections while keeping separate query projections, reducing KV memory and compute.',
    description:
      'GQA is an attention variant where several query heads share a smaller set of key/value heads. This preserves most model quality while significantly lowering memory footprint and speeding up inference.',
  },
  {
    id: 'gan',
    name: 'Generative Adversarial Networks (GANs)',
    category: 'generative',
    primaryUseCases: [
      'Realistic image generation',
      'Video generation',
      'Data augmentation',
      'Style transfer',
    ],
    keyBuildingMethod:
      'Two networks, a Generator and a Discriminator, trained adversarially in a minimax game until generated samples are indistinguishable from real data.',
    description:
      'GANs pit a generator against a discriminator: the generator tries to synthesize realistic samples, while the discriminator tries to distinguish real from fake. This competition drives the generator to produce highly realistic outputs.',
  },
  {
    id: 'vae',
    name: 'Variational Autoencoders (VAEs)',
    category: 'generative',
    primaryUseCases: [
      'Image generation',
      'Dimensionality reduction',
      'Latent space exploration',
    ],
    keyBuildingMethod:
      'Encoder–decoder architecture that learns a probabilistic latent space via a variational objective (reconstruction loss + KL divergence).',
    description:
      'VAEs map inputs to a continuous, probabilistic latent distribution and decode samples from that latent space back to the data space. This enables smooth interpolation and controllable generation.',
  },
  {
    id: 'diffusion',
    name: 'Diffusion Models',
    category: 'generative',
    primaryUseCases: [
      'High-fidelity image generation',
      'Video synthesis',
      'Audio generation',
    ],
    keyBuildingMethod:
      'Forward process gradually adds noise to data; a learned reverse process denoises step-by-step to sample from the data distribution.',
    description:
      'Diffusion models iteratively corrupt data with noise and train a neural network to reverse this process. Sampling runs the learned reverse process to transform pure noise into highly realistic images, videos, or audio.',
  },
  {
    id: 'gnn',
    name: 'Graph Neural Networks (GNNs)',
    category: 'graph',
    primaryUseCases: [
      'Social network analysis',
      'Molecular property prediction',
      'Recommendation systems',
      'Knowledge graphs',
    ],
    keyBuildingMethod:
      'Message passing where each node iteratively aggregates features from its neighbors and edges, respecting graph structure.',
    description:
      'GNNs operate on graphs by repeatedly updating node embeddings using information from neighboring nodes and edges. This makes them powerful for relational and structured data.',
  },
  {
    id: 'rnn',
    name: 'RNNs / LSTMs / GRUs',
    category: 'recurrent',
    primaryUseCases: [
      'Time-series forecasting',
      'Speech recognition',
      'Legacy NLP tasks',
    ],
    keyBuildingMethod:
      'Recurrent connections that pass hidden state through sequence steps; gated cells (LSTM/GRU) mitigate vanishing gradients and capture longer dependencies.',
    description:
      'Recurrent Neural Networks process sequences step-by-step, carrying forward a hidden state. LSTM and GRU variants use gating mechanisms to better preserve and control information over long sequences.',
  },
  {
    id: 'cnn',
    name: 'Convolutional Neural Networks (CNNs)',
    category: 'convolutional',
    primaryUseCases: [
      'Image classification',
      'Object detection',
      'Medical imaging',
      'Video analysis',
    ],
    keyBuildingMethod:
      'Convolutional filters with shared weights that detect local features (edges, textures, shapes) independent of their position.',
    description:
      'CNNs slide learnable filters over images or feature maps to extract spatial patterns. Stacking convolution, pooling, and nonlinearities yields hierarchical feature representations well-suited for visual tasks.',
  },
  {
    id: 'nas',
    name: 'Neural Architecture Search (NAS)',
    category: 'paradigm',
    primaryUseCases: [
      'Automated model design',
      'Architecture optimization for a given task',
    ],
    keyBuildingMethod:
      'Search algorithm (often RL or evolutionary) explores a space of architectures, optimizing for accuracy, latency, or resource constraints.',
    description:
      'NAS automates neural network design by treating architecture selection as a search/optimization problem. It can discover unconventional but highly effective topologies without manual tuning.',
  },
  {
    id: 'nested-learning',
    name: 'Nested Learning',
    category: 'paradigm',
    primaryUseCases: [
      'Continual learning',
      'Mitigating catastrophic forgetting',
      'Multi-level optimization',
    ],
    keyBuildingMethod:
      'Models are viewed as multi-level optimization problems, often combined with continuum memory or nested objectives to retain old knowledge while learning new tasks.',
    description:
      'Nested learning treats a single model as a hierarchy of coupled optimization problems. By structuring objectives across levels and time, it aims to support continual learning without rapidly forgetting previous tasks.',
  },
  {
    id: 'deq',
    name: 'Deep Equilibrium Models (DEQs)',
    category: 'paradigm',
    primaryUseCases: [
      'Sequence modeling',
      'Deep implicit layers with small memory footprint',
    ],
    keyBuildingMethod:
      'Define the layer output as a fixed point of a transformation and solve for this equilibrium using root-finding; backpropagate through the fixed-point solve.',
    description:
      'DEQs conceptually have infinite depth but share parameters across layers and directly solve for the steady-state hidden representation. This achieves deep behavior with fewer parameters and memory.',
  },
  {
    id: 'neural-ode',
    name: 'Neural ODEs',
    category: 'paradigm',
    primaryUseCases: [
      'Continuous-time modeling',
      'Physical systems',
      'Irregular time-series',
    ],
    keyBuildingMethod:
      'Treat layer dynamics as an ordinary differential equation and use an ODE solver as the forward pass; gradients are computed via adjoint methods.',
    description:
      'Neural ODEs view network layers as defining continuous-time dynamics. By integrating these dynamics, they can model systems naturally expressed as differential equations and handle variable-depth computation.',
  },
]

export function listArchitectures(): NeuralArchitecture[] {
  return neuralArchitectures.slice()
}

export function getArchitectureById(id: string): NeuralArchitecture | undefined {
  const key = id.toLowerCase()
  return neuralArchitectures.find(a => a.id === key || a.name.toLowerCase() === key)
}

export function listArchitecturesByCategory(category: ArchitectureCategory): NeuralArchitecture[] {
  return neuralArchitectures.filter(a => a.category === category)
}
