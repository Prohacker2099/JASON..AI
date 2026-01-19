import tf from '../tf'
import fs from 'fs'
import path from 'path'
import { ActionDefinition } from './Adapters'
import { ValueWeights, normalizeWeights } from './ValuePolicy'

export type AlignmentSample = {
  features: number[]
  label: number // 0 or 1
  meta?: any
}

export type AlignmentStatus = {
  modelDir: string
  datasetPath: string
  datasetCount: number
  lastTrainAt: string | null
  featureSize: number
}

const MODEL_DIR = path.join(process.cwd(), 'data', 'models', 'alignment')
const DATASET_PATH = path.join(MODEL_DIR, 'dataset.json')

const ACTION_TYPES: Array<ActionDefinition['type']> = ['http','process','device','file','powershell','app']

// Minimal tag mapping to value categories
const VALUE_KEYS = ['morality','kindness','courage','determination','empathy','helpfulness'] as const
const TAG_GROUPS: Record<(typeof VALUE_KEYS)[number], string[]> = {
  morality: ['moral','ethical','safe'],
  kindness: ['kind','nice','polite'],
  courage: ['brave','risk'],
  determination: ['persist','focus'],
  empathy: ['empath','care'],
  helpfulness: ['help','assist','support'],
}

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }) }

function readDataset(): AlignmentSample[] {
  try {
    if (!fs.existsSync(DATASET_PATH)) return []
    const raw = fs.readFileSync(DATASET_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.samples) ? parsed.samples as AlignmentSample[] : []
  } catch { return [] }
}

function writeDataset(samples: AlignmentSample[]) {
  ensureDir(MODEL_DIR)
  const payload = { samples, updatedAt: Date.now() }
  fs.writeFileSync(DATASET_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

export class AlignmentModel {
  private model: any | null = null
  private featureSize = 1 + ACTION_TYPES.length + VALUE_KEYS.length + 1 // risk + type one-hot + tag groups + tagPosCount
  private lastTrainAt: number | null = null

  getFeatureSize() { return this.featureSize }

  private buildModel() {
    const m = tf.sequential()
    m.add(tf.layers.dense({ units: 12, inputShape: [this.featureSize], activation: 'relu' }))
    m.add(tf.layers.dense({ units: 6, activation: 'relu' }))
    m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
    m.compile({ optimizer: tf.train.adam(1e-3), loss: 'binaryCrossentropy' })
    this.model = m
  }

  private async ensureModel() {
    ensureDir(MODEL_DIR)
    const modelJson = path.join(MODEL_DIR, 'model.json')
    if (this.model) return
    if (fs.existsSync(modelJson)) {
      try { this.model = await tf.loadLayersModel('file://' + modelJson); return } catch {}
    }
    this.buildModel()
  }

  private oneHotType(t: ActionDefinition['type'] | undefined): number[] {
    const arr = new Array(ACTION_TYPES.length).fill(0)
    if (!t) return arr
    const idx = ACTION_TYPES.indexOf(t)
    if (idx >= 0) arr[idx] = 1
    return arr
  }

  private tagGroupVector(tags?: string[]): number[] {
    const out = new Array(VALUE_KEYS.length).fill(0)
    const src = (tags || []).map(t => String(t).toLowerCase())
    for (let vi = 0; vi < VALUE_KEYS.length; vi++) {
      const key = VALUE_KEYS[vi]
      const words = TAG_GROUPS[key]
      for (const w of words) {
        if (src.some(t => t.includes(w))) { out[vi] = 1; break }
      }
    }
    return out
  }

  featuresFromAction(a: ActionDefinition, _weights?: ValueWeights): number[] {
    const risk = Math.max(0, Math.min(1, Number(a.riskLevel ?? 0)))
    const types = this.oneHotType(a.type)
    const tagVec = this.tagGroupVector(a.tags)
    const tagPosCount = tagVec.reduce((s, v) => s + (v > 0 ? 1 : 0), 0) / VALUE_KEYS.length
    const feats: number[] = [risk, ...types, ...tagVec, tagPosCount]
    // Sanity check
    if (feats.length !== this.featureSize) {
      while (feats.length < this.featureSize) feats.push(0)
      if (feats.length > this.featureSize) feats.length = this.featureSize
    }
    return feats
  }

  async train(epochs = 30, batchSize = 32): Promise<{ ok: boolean; loss?: number; count: number }> {
    const samples = readDataset()
    if (samples.length < 20) return { ok: false, count: samples.length }
    await this.ensureModel()

    const X = tf.tensor2d(samples.map(s => s.features), [samples.length, this.featureSize])
    const y = tf.tensor2d(samples.map(s => [Math.max(0, Math.min(1, s.label))]), [samples.length, 1])

    const hist = await (this.model as any).fit(X, y, {
      epochs: Math.max(1, Math.min(epochs, 200)),
      batchSize: Math.max(4, Math.min(batchSize, 512)),
      verbose: 0,
      shuffle: true,
    })

    X.dispose(); y.dispose()
    this.lastTrainAt = Date.now()
    try { await (this.model as any).save('file://' + MODEL_DIR) } catch {}
    const loss = (hist.history.loss?.[hist.history.loss.length - 1] as number) || undefined
    return { ok: true, loss, count: samples.length }
  }

  score(features: number[]): number {
    if (!this.model) return this.heuristicScore(features)
    try {
      const x = tf.tensor2d([features], [1, this.featureSize])
      const y = (this.model as any).predict(x) as any
      const v = (y.dataSync() as Float32Array)[0]
      x.dispose(); y.dispose()
      if (!Number.isFinite(v)) return this.heuristicScore(features)
      return Math.max(0, Math.min(1, v))
    } catch {
      return this.heuristicScore(features)
    }
  }

  scoreForAction(a: ActionDefinition, weights?: ValueWeights): number {
    const feats = this.featuresFromAction(a, weights)
    return this.score(feats)
  }

  private heuristicScore(features: number[]): number {
    // features layout: [risk, ...type6, ...tag6, tagPosCount]
    const risk = features[0] || 0
    const tagPosCount = features[1 + ACTION_TYPES.length + VALUE_KEYS.length] || 0
    const base = 0.5 + (tagPosCount * 0.4) - (risk * 0.4)
    return Math.max(0, Math.min(1, base))
  }

  ingest(sample: AlignmentSample, keepLast = 20000): AlignmentStatus {
    const items = readDataset()
    items.push({ features: sample.features.slice(0, this.featureSize), label: sample.label ? 1 : 0, meta: sample.meta })
    const trimmed = items.slice(Math.max(0, items.length - keepLast))
    writeDataset(trimmed)
    return this.getStatus()
  }

  ingestFromAction(action: ActionDefinition, label: number, weights?: ValueWeights): AlignmentStatus {
    const feats = this.featuresFromAction(action, weights)
    return this.ingest({ features: feats, label: label ? 1 : 0, meta: { action } })
  }

  getStatus(): AlignmentStatus {
    const samples = readDataset()
    return {
      modelDir: MODEL_DIR,
      datasetPath: DATASET_PATH,
      datasetCount: samples.length,
      lastTrainAt: this.lastTrainAt ? new Date(this.lastTrainAt).toISOString() : null,
      featureSize: this.featureSize,
    }
  }
}

export const alignmentModel = new AlignmentModel()
