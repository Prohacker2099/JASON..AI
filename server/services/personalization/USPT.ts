import { EventEmitter } from 'events'
import { prisma } from '../../utils/prisma'

export type USPTChannel = 'email' | 'chat' | 'note' | 'task' | 'generic'

export type ToneProfile = {
  wordChoice: Record<string, number>
  sentenceLength: { mean: number; std: number }
  punctuationDensity: number
  formalityLevel: 'casual' | 'neutral' | 'formal'
  formatSchema: 'plain' | 'bulleted' | 'numbered'
}

export type ToneQuery = {
  channel?: USPTChannel
  recipient?: string
  taskType?: string
  limit?: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\.\!\?\-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function splitSentences(text: string): string[] {
  return text
    .split(/[\.\!\?]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

export class USPT extends EventEmitter {
  async getToneProfile(query: ToneQuery = {}): Promise<ToneProfile> {
    const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0 ? query.limit : 200

    let rows: any[] = []
    try {
      rows = await prisma.communication.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      })
    } catch {
      rows = []
    }

    if (query.channel) {
      const ch = String(query.channel).toLowerCase()
      rows = rows.filter(r => typeof r.type === 'string' && r.type.toLowerCase().includes(ch))
    }

    if (query.recipient) {
      const rec = query.recipient.toLowerCase()
      rows = rows.filter(r =>
        (typeof r.recipient === 'string' && r.recipient.toLowerCase().includes(rec)) ||
        (typeof r.to === 'string' && r.to.toLowerCase().includes(rec)),
      )
    }

    if (rows.length === 0) {
      return {
        wordChoice: {},
        sentenceLength: { mean: 12, std: 4 },
        punctuationDensity: 0.05,
        formalityLevel: 'neutral',
        formatSchema: 'plain',
      }
    }

    let fullText = ''
    for (const r of rows) {
      const body = typeof r.content === 'string' ? r.content : ''
      const subj = typeof (r as any).subject === 'string' ? (r as any).subject : ''
      fullText += subj + '\n' + body + '\n\n'
    }

    const tokens = tokenize(fullText)
    const sentences = splitSentences(fullText)

    // Word frequencies
    const counts = new Map<string, number>()
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
    const total = tokens.length || 1
    const wordChoice: Record<string, number> = {}
    for (const [w, c] of counts.entries()) {
      if (c / total < 0.005) continue
      wordChoice[w] = c / total
    }

    // Sentence length stats
    const lens: number[] = []
    for (const s of sentences) {
      const ts = tokenize(s)
      if (ts.length > 0) lens.push(ts.length)
    }
    const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 12
    const variance =
      lens.length > 1
        ? lens.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / (lens.length - 1)
        : 4
    const std = Math.sqrt(variance)

    // Punctuation density
    const raw = fullText || ''
    const punctChars = raw.match(/[\,\;\:\-\(\)\"\']+/g)?.join('') ?? ''
    const punctuationDensity = clamp01((punctChars.length || 0) / Math.max(1, raw.length))

    // Formality heuristic
    const lower = raw.toLowerCase()
    let scoreFormal = 0
    if (/dear\b/.test(lower)) scoreFormal += 0.3
    if (/regards|sincerely|best wishes|kind regards/.test(lower)) scoreFormal += 0.3
    if (/please|kindly|appreciate/.test(lower)) scoreFormal += 0.2
    if (/hey|hi|yo\b/.test(lower)) scoreFormal -= 0.2
    if (/lol|lmao|omg|btw/.test(lower)) scoreFormal -= 0.3
    scoreFormal = Math.max(-0.5, Math.min(0.8, scoreFormal))

    let formalityLevel: ToneProfile['formalityLevel'] = 'neutral'
    if (scoreFormal >= 0.4) formalityLevel = 'formal'
    else if (scoreFormal <= -0.1) formalityLevel = 'casual'

    // Format schema heuristic: look for list patterns
    const lines = fullText.split(/\r?\n/)
    let bulletLike = 0
    let numberedLike = 0
    for (const ln of lines) {
      const t = ln.trim()
      if (!t) continue
      if (/^[-*\u2022]\s+/.test(t)) bulletLike++
      if (/^\d+\.[\)\s]/.test(t)) numberedLike++
    }
    const totalLines = lines.filter(l => l.trim()).length || 1
    const fracBullet = bulletLike / totalLines
    const fracNumbered = numberedLike / totalLines

    let formatSchema: ToneProfile['formatSchema'] = 'plain'
    if (fracNumbered >= 0.2 && fracNumbered >= fracBullet) formatSchema = 'numbered'
    else if (fracBullet >= 0.2) formatSchema = 'bulleted'

    const profile: ToneProfile = {
      wordChoice,
      sentenceLength: { mean, std },
      punctuationDensity,
      formalityLevel,
      formatSchema,
    }

    try {
      await prisma.learningEvent.create({
        data: {
          event: 'uspt_profile',
          data: { query, profile } as any,
        },
      })
    } catch {}

    this.emit('profile', { query, profile })
    return profile
  }

  async ingestExample(text: string, meta?: { channel?: USPTChannel; recipient?: string; taskType?: string }) {
    const body = String(text || '')
    if (!body.trim()) return
    try {
      await prisma.learningEvent.create({
        data: {
          event: 'uspt_example',
          data: { meta, text: body } as any,
        },
      })
    } catch {}
    this.emit('example', { text: body, meta })
  }
}

export const uspt = new USPT()
