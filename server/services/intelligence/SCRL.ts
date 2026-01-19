import { prisma } from '../../utils/prisma'
import { selfLearningEngine } from '../ai/selfLearning/Engine'
import { alignmentModel } from '../ai/selfLearning/Alignment'
import { ethics } from './Ethics'
import { retryPolicy } from '../automation/RetryPolicy'
import { stealthPolicy } from '../automation/StealthPolicy'

export type ExecutionReview = {
  id: string
  planId: string
  taskId: string
  planned: any
  actual: any
  success: boolean
  timestamp: string
  reflection: string
  adjustments: Record<string, number>
}

export class SCRL {
  async reviewExecution(planId: string, taskId: string, planned: any, actual: any, success: boolean): Promise<ExecutionReview> {
    const id = `scrl_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    const timestamp = new Date().toISOString()

    // Reflection: compare plan vs actual
    const reflection = this.reflect(planned, actual, success)

    // Adjustments: score outcomes and update models
    const adjustments = await this.adjustModels(planned, actual, success, reflection)

    let ethicsPlanned: any = null
    let ethicsActual: any = null
    try { ethicsPlanned = ethics.scanText(JSON.stringify(planned || {})) } catch {}
    try { ethicsActual = ethics.scanText(JSON.stringify(actual || {})) } catch {}

    const review: ExecutionReview = { id, planId, taskId, planned, actual: { ...actual, ethics: ethicsActual }, success, timestamp, reflection, adjustments }

    // Rule injection: if failed with 429 or CAPTCHA, add retry/delay rule and update stealth blacklist
    try {
      const action = planned?.action
      const urlStr = action?.payload?.url ? String(action.payload.url) : null
      const host = urlStr ? (new URL(urlStr)).hostname.toLowerCase() : null
      const status = Number((actual as any)?.status || 0)
      const err = String((actual as any)?.error || '')
      if (!success && (status === 429 || err === 'captcha_detected')) {
        if (host) {
          if (status === 429) {
            try { stealthPolicy.record429(host) } catch {}
            try {
              retryPolicy.add({ scope: 'domain', pattern: host, randomizedDelayMs: [500, 3000], retry: { max: 2, backoffMs: 5000, jitter: 0.5 }, ttlMs: 10 * 60 * 1000 })
            } catch {}
          }
          if (err === 'captcha_detected') {
            try { stealthPolicy.recordCaptcha(host) } catch {}
            try {
              retryPolicy.add({ scope: 'domain', pattern: host, randomizedDelayMs: [5000, 30000], retry: { max: 2, backoffMs: 10000, jitter: 0.3 }, ttlMs: 6 * 60 * 60 * 1000 })
            } catch {}
          }
        }
      }
    } catch {}

    // Log to database
    try {
      await prisma.learningEvent.create({
        data: { event: 'scrl_review', data: review as any }
      })
      try { await ethics.logAudit({ type: 'scrl_ethics', planId, taskId, plannedScan: ethicsPlanned, actualScan: ethicsActual }) } catch {}
    } catch {}

    return review
  }

  private reflect(planned: any, actual: any, success: boolean): string {
    const parts: string[] = []
    
    if (success) {
      parts.push('✓ Task completed successfully.')
    } else {
      parts.push('✗ Task failed or incomplete.')
    }

    // Compare timing
    if (planned.estimatedDuration && actual.duration) {
      const ratio = actual.duration / planned.estimatedDuration
      if (ratio > 1.5) parts.push(`⏱ Took ${(ratio).toFixed(1)}x longer than estimated.`)
      else if (ratio < 0.7) parts.push(`⏱ Completed ${(1/ratio).toFixed(1)}x faster than estimated.`)
    }

    // Compare cost/impact
    if (planned.estimatedCost && actual.cost) {
      const diff = actual.cost - planned.estimatedCost
      if (diff > 0) parts.push(`💰 Cost $${diff.toFixed(2)} more than estimated.`)
      else if (diff < 0) parts.push(`💰 Saved $${(-diff).toFixed(2)}.`)
    }

    // Compare quality/alignment
    if (planned.alignmentScore && actual.alignmentScore) {
      const delta = actual.alignmentScore - planned.alignmentScore
      if (delta > 0.1) parts.push(`✨ Alignment improved by ${(delta*100).toFixed(0)}%.`)
      else if (delta < -0.1) parts.push(`⚠ Alignment dropped by ${((-delta)*100).toFixed(0)}%.`)
    }

    return parts.join(' ')
  }

  private async adjustModels(planned: any, actual: any, success: boolean, reflection: string): Promise<Record<string, number>> {
    const adj: Record<string, number> = {}

    // Adjust self-learning engine weights if available
    try {
      const w = (selfLearningEngine as any).getWeights?.()
      if (w && success) {
        // Boost values that led to success
        if (planned.tags?.includes('help')) adj['kindness'] = 0.05
        if (planned.tags?.includes('safe')) adj['morality'] = 0.05
        if (planned.tags?.includes('efficient')) adj['determination'] = 0.05
      }
      if (w && !success && planned.tags?.includes('risky')) {
        adj['morality'] = -0.05
      }
    } catch {}

    // Adjust alignment model if available
    try {
      if (success && actual.alignmentScore) {
        await alignmentModel.ingest({ features: [], label: actual.alignmentScore > 0.5 ? 1 : 0 })
      }
    } catch {}

    // Log adjustment
    if (Object.keys(adj).length > 0) {
      try {
        await prisma.learningEvent.create({
          data: { event: 'scrl_adjustment', data: { reflection, adjustments: adj } as any }
        })
      } catch {}
    }

    return adj
  }

  async getReviews(planId?: string, limit = 50): Promise<ExecutionReview[]> {
    try {
      const rows = await prisma.learningEvent.findMany({
        where: { event: 'scrl_review' },
        orderBy: { timestamp: 'desc' },
        take: limit
      })
      return rows
        .filter((r: any) => !planId || (r.data as any)?.planId === planId)
        .map((r: any) => (r.data as any) as ExecutionReview)
    } catch {
      return []
    }
  }
}

export const scrl = new SCRL()
