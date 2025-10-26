import * as tf from '@tensorflow/tfjs-node'
import fs from 'fs'
import path from 'path'

export type USPTLabel = { tone?: number; format?: number; bias?: number }
export type USPTSample = { features: number[]; label: [number, number, number]; meta?: any }
export type USPTStatus = { modelDir: string; datasetPath: string; datasetCount: number; featureSize: number; lastTrainAt: string | null }

const MODEL_DIR = path.join(process.cwd(), 'data', 'models', 'uspt')
const DATASET_PATH = path.join(MODEL_DIR, 'dataset.json')

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }) }

function readDataset(): USPTSample[] {
  try {
    if (!fs.existsSync(DATASET_PATH)) return []
    const raw = fs.readFileSync(DATASET_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.samples) ? parsed.samples as USPTSample[] : []
  } catch { return [] }
}

function writeDataset(samples: USPTSample[]) {
  ensureDir(MODEL_DIR)
  const payload = { samples, updatedAt: Date.now() }
  fs.writeFileSync(DATASET_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

function toVectorLabel(lbl?: USPTLabel): [number, number, number] {
  const t = Math.max(0, Math.min(1, Number(lbl?.tone ?? 0.5)))
  const f = Math.max(0, Math.min(1, Number(lbl?.format ?? 0.5)))
  const b = Math.max(0, Math.min(1, Number(lbl?.bias ?? 0.5)))
  return [t, f, b]
}

function textFeatures(text: string): number[] {
  const t = String(text || '')
  const len = t.length
  const words = t.trim().split(/\s+/).filter(Boolean)
  const sentences = t.split(/[.!?]+/)
  const upper = (t.match(/[A-Z]/g) || []).length
  const punc = (t.match(/[\.,!?;:]/g) || []).length
  const emojis = (t.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length
  const newlines = (t.match(/\n/g) || []).length

  const lenNorm = Math.min(1, len / 1000)
  const upperRatio = len > 0 ? upper / len : 0
  const puncRatio = len > 0 ? punc / len : 0
  const avgSentenceLen = sentences.length > 0 ? Math.min(1, (words.length / Math.max(1, sentences.length)) / 50) : 0
  const emojiRatio = len > 0 ? Math.min(1, emojis / 20) : 0
  const newlineRatio = len > 0 ? Math.min(1, newlines / 50) : 0

  return [lenNorm, upperRatio, puncRatio, avgSentenceLen, emojiRatio, newlineRatio]
}

export class USPT {
  private model: tf.LayersModel | null = null
  private featureSize = 6
  private lastTrainAt: number | null = null

  private async ensureModel() {
    ensureDir(MODEL_DIR)
    const modelJson = path.join(MODEL_DIR, 'model.json')
    if (this.model) return
    if (fs.existsSync(modelJson)) {
      try { this.model = await tf.loadLayersModel('file://' + modelJson); return } catch {}
    }
    const m = tf.sequential()
    m.add(tf.layers.dense({ units: 16, inputShape: [this.featureSize], activation: 'relu' }))
    m.add(tf.layers.dense({ units: 8, activation: 'relu' }))
    m.add(tf.layers.dense({ units: 3, activation: 'sigmoid' }))
    m.compile({ optimizer: tf.train.adam(1e-3), loss: 'meanSquaredError' })
    this.model = m
  }

  getStatus(): USPTStatus {
    const samples = readDataset()
    return { modelDir: MODEL_DIR, datasetPath: DATASET_PATH, datasetCount: samples.length, featureSize: this.featureSize, lastTrainAt: this.lastTrainAt ? new Date(this.lastTrainAt).toISOString() : null }
  }

  ingest(sample: { features: number[]; label?: USPTLabel; meta?: any }, keepLast = 20000): USPTStatus {
    const items = readDataset()
    const lbl = toVectorLabel(sample.label)
    const feats = (sample.features || []).slice(0, this.featureSize)
    while (feats.length < this.featureSize) feats.push(0)
    items.push({ features: feats, label: lbl, meta: sample.meta })
    const trimmed = items.slice(Math.max(0, items.length - keepLast))
    writeDataset(trimmed)
    return this.getStatus()
  }

  ingestFromText(text: string, label?: USPTLabel, meta?: any): USPTStatus {
    const feats = textFeatures(text)
    return this.ingest({ features: feats, label, meta })
  }

  async train(epochs = 15, batchSize = 32): Promise<{ ok: boolean; loss?: number; count: number }> {
    const samples = readDataset()
    if (samples.length < 20) return { ok: false, count: samples.length }
    await this.ensureModel()

    const X = tf.tensor2d(samples.map(s => s.features), [samples.length, this.featureSize])
    const y = tf.tensor2d(samples.map(s => s.label), [samples.length, 3])

    const hist = await (this.model as tf.LayersModel).fit(X, y, {
      epochs: Math.max(1, Math.min(epochs, 200)),
      batchSize: Math.max(4, Math.min(batchSize, 512)),
      verbose: 0,
      shuffle: true,
    })

    X.dispose(); y.dispose()
    this.lastTrainAt = Date.now()
    try { await (this.model as tf.LayersModel).save('file://' + MODEL_DIR) } catch {}
    const loss = (hist.history.loss?.[hist.history.loss.length - 1] as number) || undefined
    return { ok: true, loss, count: samples.length }
  }

  score(features: number[]): [number, number, number] {
    if (!this.model) return this.heuristic(features)
    try {
      const x = tf.tensor2d([features.slice(0, this.featureSize)], [1, this.featureSize])
      const y = (this.model as tf.LayersModel).predict(x) as tf.Tensor
      const v = Array.from((y.dataSync() as Float32Array)) as number[]
      x.dispose(); y.dispose()
      const out: [number, number, number] = [Number(v[0]||0.5), Number(v[1]||0.5), Number(v[2]||0.5)]
      return out
    } catch {
      return this.heuristic(features)
    }
  }

  scoreForText(text: string): [number, number, number] {
    const feats = textFeatures(text)
    return this.score(feats)
  }

  private heuristic(features: number[]): [number, number, number] {
    const lenNorm = features[0] || 0
    const upperRatio = features[1] || 0
    const puncRatio = features[2] || 0
    const avgSentenceLen = features[3] || 0
    const emojiRatio = features[4] || 0
    const newlineRatio = features[5] || 0
    const tone = Math.max(0, Math.min(1, 0.6 - upperRatio * 0.3 + emojiRatio * 0.2))
    const format = Math.max(0, Math.min(1, 0.4 + avgSentenceLen * 0.4 + newlineRatio * 0.2))
    const bias = Math.max(0, Math.min(1, 0.5 + puncRatio * 0.2 + lenNorm * 0.1))
    return [tone, format, bias]
  }
}

export const uspt = new USPT()
