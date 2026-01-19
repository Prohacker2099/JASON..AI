import { EventEmitter } from 'events'
import { prisma } from '../../utils/prisma'

export type RuleScope = 'domain' | 'endpoint' | 'selector'
export type RetryConfig = { max: number; backoffMs: number; jitter: number }
export type RetryRule = {
  id: string
  scope: RuleScope
  pattern: string // host or host+path or selector
  randomizedDelayMs?: [number, number]
  retry?: RetryConfig
  addedAt: number
  ttlMs?: number | null
}

class RetryPolicy extends EventEmitter {
  private rules: RetryRule[] = []

  add(rule: Omit<RetryRule, 'id' | 'addedAt'>): RetryRule {
    const r: RetryRule = { id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, addedAt: Date.now(), ...rule }
    this.rules.push(r)
    try { void prisma.learningEvent.create({ data: { event: 'scrl_rule', data: r as any } }) } catch {}
    try { this.emit('update', r) } catch {}
    return r
  }

  status() { return { rules: this.rules.slice(), now: Date.now() } }

  private matchUrl(scope: RuleScope, pattern: string, urlStr: string): boolean {
    try {
      const u = new URL(urlStr)
      if (scope === 'domain') return u.hostname.toLowerCase() === pattern.toLowerCase()
      if (scope === 'endpoint') return (u.hostname + u.pathname).toLowerCase().includes(pattern.toLowerCase())
      return false
    } catch { return false }
  }

  findForAction(a: any): RetryRule | null {
    try {
      if ((a?.type === 'http' || a?.type === 'web') && a?.payload?.url) {
        const url = String(a.payload.url)
        const endpointRule = this.rules.find(r => r.scope === 'endpoint' && this.matchUrl('endpoint', r.pattern, url))
        if (endpointRule) return endpointRule
        const host = new URL(url).hostname.toLowerCase()
        const domainRule = this.rules.find(r => r.scope === 'domain' && r.pattern.toLowerCase() === host)
        if (domainRule) return domainRule
      }
      return null
    } catch { return null }
  }
}

export const retryPolicy = new RetryPolicy()
