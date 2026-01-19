import tf from '../tf'

export type PolicyArchitectureId =
  | 'dqn_mlp'
  | 'transformer'
  | 'mamba'
  | 'gan'
  | 'vae'
  | 'diffusion'
  | 'gnn'
  | 'rnn'
  | 'cnn'
  | 'deq'
  | 'neural_ode'
  | 'nas'
  | 'nested_learning'

export type PolicyModelConfig = {
  stateSize: number
  actionSize: number
  learningRate: number
}

export type PolicyArchitectureSpec = {
  id: PolicyArchitectureId
  name: string
  kind: 'value' | 'sequence' | 'generative' | 'graph' | 'recurrent' | 'convolutional' | 'paradigm'
}

const POLICY_ARCHITECTURES: PolicyArchitectureSpec[] = [
  { id: 'dqn_mlp', name: 'DQN Multi-Layer Perceptron', kind: 'value' },
  { id: 'transformer', name: 'Transformer-like Self-Attention Policy', kind: 'sequence' },
  { id: 'mamba', name: 'Mamba-style Selective State Policy', kind: 'sequence' },
  { id: 'gan', name: 'GAN-style Critic Policy', kind: 'generative' },
  { id: 'vae', name: 'VAE-style Latent Policy', kind: 'generative' },
  { id: 'diffusion', name: 'Diffusion-style Denoiser Policy', kind: 'generative' },
  { id: 'gnn', name: 'Graph Neural Network Policy', kind: 'graph' },
  { id: 'rnn', name: 'RNN / GRU Sequence Policy', kind: 'recurrent' },
  { id: 'cnn', name: '1D Convolutional Policy', kind: 'convolutional' },
  { id: 'deq', name: 'Deep Equilibrium Policy', kind: 'paradigm' },
  { id: 'neural_ode', name: 'Neural ODE-inspired Policy', kind: 'paradigm' },
  { id: 'nas', name: 'Neural Architecture Search Controller', kind: 'paradigm' },
  { id: 'nested_learning', name: 'Nested Learning Policy', kind: 'paradigm' },
]

export function listPolicyArchitectures(): PolicyArchitectureSpec[] {
  return POLICY_ARCHITECTURES.slice()
}

export function getPolicyArchitecture(id: PolicyArchitectureId): PolicyArchitectureSpec | undefined {
  return POLICY_ARCHITECTURES.find(a => a.id === id)
}

export function buildPolicyModel(id: PolicyArchitectureId, cfg: PolicyModelConfig): any {
  switch (id) {
    case 'transformer':
      return buildTransformerLike(cfg)
    case 'mamba':
      return buildMambaLike(cfg)
    case 'gan':
      return buildGanCritic(cfg)
    case 'vae':
      return buildVaeLatent(cfg)
    case 'diffusion':
      return buildDiffusionLike(cfg)
    case 'gnn':
      return buildGnnLike(cfg)
    case 'rnn':
      return buildRnnGru(cfg)
    case 'cnn':
      return buildCnn1d(cfg)
    case 'deq':
      return buildDeqLike(cfg)
    case 'neural_ode':
      return buildNeuralOdeLike(cfg)
    case 'nas':
      return buildNasLike(cfg)
    case 'nested_learning':
      return buildNestedLike(cfg)
    default:
      return buildDqnMlp(cfg)
  }
}

function buildDqnMlp(cfg: PolicyModelConfig): any {
  const model = tf.sequential()
  model.add(tf.layers.dense({ units: 64, inputShape: [cfg.stateSize], activation: 'relu' }))
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: cfg.actionSize }))
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildTransformerLike(cfg: PolicyModelConfig): any {
  const input = tf.input({ shape: [cfg.stateSize] })
  const proj = tf.layers.dense({ units: cfg.stateSize, activation: 'relu' }).apply(input) as any
  const gate = tf.layers.dense({ units: cfg.stateSize, activation: 'sigmoid' }).apply(input) as any
  const mixed = tf.layers.multiply().apply([proj, gate]) as any
  const hidden = tf.layers.dense({ units: Math.max(32, cfg.stateSize), activation: 'relu' }).apply(mixed) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildMambaLike(cfg: PolicyModelConfig): any {
  const input = tf.input({ shape: [cfg.stateSize] })
  const proj = tf.layers.dense({ units: cfg.stateSize, activation: 'relu' }).apply(input) as any
  const gate = tf.layers.dense({ units: cfg.stateSize, activation: 'sigmoid' }).apply(proj) as any
  const gated = tf.layers.multiply().apply([proj, gate]) as any
  const hidden = tf.layers.dense({ units: Math.max(32, Math.floor(cfg.stateSize * 1.5)), activation: 'relu' }).apply(gated) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildGanCritic(cfg: PolicyModelConfig): any {
  const model = tf.sequential()
  model.add(tf.layers.dense({ units: 64, inputShape: [cfg.stateSize], activation: 'relu' }))
  model.add(tf.layers.dropout({ rate: 0.3 }))
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: cfg.actionSize }))
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildVaeLatent(cfg: PolicyModelConfig): any {
  const model = tf.sequential()
  const latent = Math.max(8, Math.floor(cfg.stateSize / 2))
  model.add(tf.layers.dense({ units: latent, inputShape: [cfg.stateSize], activation: 'relu' }))
  model.add(tf.layers.dense({ units: Math.max(16, latent), activation: 'relu' }))
  model.add(tf.layers.dense({ units: cfg.actionSize }))
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildDiffusionLike(cfg: PolicyModelConfig): any {
  const input = tf.input({ shape: [cfg.stateSize] })
  const h1 = tf.layers.dense({ units: Math.max(32, cfg.stateSize), activation: 'relu' }).apply(input) as any
  const h2 = tf.layers.dense({ units: cfg.stateSize, activation: 'relu' }).apply(h1) as any
  const res = tf.layers.add().apply([input, h2]) as any
  const hidden = tf.layers.dense({ units: 32, activation: 'relu' }).apply(res) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildGnnLike(cfg: PolicyModelConfig): any {
  const model = tf.sequential()
  model.add(tf.layers.dense({ units: Math.max(32, cfg.stateSize), inputShape: [cfg.stateSize], activation: 'relu' }))
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
  model.add(tf.layers.dense({ units: cfg.actionSize }))
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildRnnGru(cfg: PolicyModelConfig): any {
  const layersAny = tf.layers as any
  if (typeof layersAny.gru !== 'function') return buildDqnMlp(cfg)
  const input = tf.input({ shape: [cfg.stateSize] })
  const reshaped = tf.layers.reshape({ targetShape: [cfg.stateSize, 1] }).apply(input) as any
  const rnnOut = layersAny.gru({ units: 32, returnSequences: false }).apply(reshaped) as any
  const hidden = tf.layers.dense({ units: 32, activation: 'relu' }).apply(rnnOut) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildCnn1d(cfg: PolicyModelConfig): any {
  const layersAny = tf.layers as any
  if (typeof layersAny.conv1d !== 'function') return buildDqnMlp(cfg)
  const input = tf.input({ shape: [cfg.stateSize] })
  const reshaped = tf.layers.reshape({ targetShape: [cfg.stateSize, 1] }).apply(input) as any
  const conv = layersAny.conv1d({ filters: 16, kernelSize: 3, activation: 'relu', padding: 'valid' }).apply(reshaped) as any
  const pooled = typeof layersAny.maxPooling1d === 'function'
    ? (layersAny.maxPooling1d({ poolSize: 2, strides: 2 }).apply(conv) as any)
    : conv
  const flat = tf.layers.flatten().apply(pooled) as any
  const hidden = tf.layers.dense({ units: 32, activation: 'relu' }).apply(flat) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildDeqLike(cfg: PolicyModelConfig): any {
  const input = tf.input({ shape: [cfg.stateSize] })
  const h1 = tf.layers.dense({ units: cfg.stateSize, activation: 'tanh' }).apply(input) as any
  const h2 = tf.layers.dense({ units: cfg.stateSize, activation: 'tanh' }).apply(h1) as any
  const eq = tf.layers.add().apply([input, h2]) as any
  const hidden = tf.layers.dense({ units: 32, activation: 'relu' }).apply(eq) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildNeuralOdeLike(cfg: PolicyModelConfig): any {
  const input = tf.input({ shape: [cfg.stateSize] })
  const f = tf.layers.dense({ units: cfg.stateSize, activation: 'tanh' }).apply(input) as any
  const step = tf.layers.add().apply([input, f]) as any
  const hidden = tf.layers.dense({ units: 32, activation: 'relu' }).apply(step) as any
  const out = tf.layers.dense({ units: cfg.actionSize }).apply(hidden) as any
  const model = tf.model({ inputs: input, outputs: out })
  const opt = tf.train.adam(cfg.learningRate)
  model.compile({ optimizer: opt, loss: 'meanSquaredError' })
  return model
}

function buildNasLike(cfg: PolicyModelConfig): any {
  return buildGanCritic(cfg)
}

function buildNestedLike(cfg: PolicyModelConfig): any {
  return buildDiffusionLike(cfg)
}
