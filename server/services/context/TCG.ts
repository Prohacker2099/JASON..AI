import { prisma } from '../../utils/prisma'

export type ContextItem = {
  id: string
  type: 'browser' | 'communication' | 'insight' | 'learning' | 'device'
  title: string
  timestamp: string
  score: number
  data: any
}

function decayScore(ts: Date, halfLifeMinutes = 60): number {
  const now = Date.now()
  const dtMin = Math.max(0, (now - ts.getTime()) / 60000)
  const lambda = Math.log(2) / Math.max(1, halfLifeMinutes)
  return Math.exp(-lambda * dtMin)
}

function boostCriticality(text: string): number {
  const t = (text || '').toLowerCase()
  const key = [
    'allerg', 'emergency', 'deadline', 'budget', 'finance', 'meeting', 'exam', 'appointment', 'booking', 'flight', 'visa'
  ]
  let score = 0
  for (const k of key) if (t.includes(k)) score += 0.2
  return Math.min(0.8, score)
}

export async function getTopContext(limit = 20, types?: Array<ContextItem['type']>): Promise<ContextItem[]> {
  const want = new Set((types && types.length ? types : ['browser','communication','insight','learning']) as ContextItem['type'][])

  const items: ContextItem[] = []

  if (want.has('browser')) {
    const rows = await prisma.browserHistory.findMany({ orderBy: { visitedAt: 'desc' }, take: limit })
    for (const r of rows) {
      const base = decayScore(r.visitedAt)
      const boost = boostCriticality(`${r.title || ''} ${Array.isArray(r.tags) ? (r.tags as any[]).join(' ') : ''}`)
      items.push({ id: r.id, type: 'browser', title: r.title || r.url, timestamp: r.visitedAt.toISOString(), score: base + boost, data: { url: r.url, tags: r.tags, duration: r.duration } })
    }
  }

  if (want.has('communication')) {
    const rows = await prisma.communication.findMany({ orderBy: { timestamp: 'desc' }, take: limit })
    for (const r of rows) {
      const base = decayScore(r.timestamp)
      const boost = boostCriticality(`${r.sender} ${r.recipient} ${r.content}`)
      items.push({ id: r.id, type: 'communication', title: `${r.type}: ${r.sender} → ${r.recipient}`, timestamp: r.timestamp.toISOString(), score: base + boost, data: { status: r.status } })
    }
  }

  if (want.has('insight')) {
    const rows = await prisma.insight.findMany({ orderBy: { generatedAt: 'desc' }, take: limit })
    for (const r of rows) {
      const base = decayScore(r.generatedAt)
      const boost = boostCriticality(`${r.context} ${r.content}`)
      items.push({ id: r.id, type: 'insight', title: `${r.type}: ${r.context}`, timestamp: r.generatedAt.toISOString(), score: base + boost + (r.relevance || 0), data: { confidence: r.confidence } })
    }
  }

  if (want.has('learning')) {
    const rows = await prisma.learningEvent.findMany({ orderBy: { timestamp: 'desc' }, take: limit })
    for (const r of rows) {
      const base = decayScore(r.timestamp)
      const boost = boostCriticality(`${r.event}`)
      items.push({ id: r.id, type: 'learning', title: r.event, timestamp: r.timestamp.toISOString(), score: base + boost, data: r.data })
    }
  }

  // Sort and trim
  items.sort((a, b) => b.score - a.score)
  return items.slice(0, limit)
}
