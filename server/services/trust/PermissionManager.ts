import { EventEmitter } from 'events'
import { sseBroker } from '../websocket-service'

export type TrustLevel = 1 | 2 | 3

export type TrustPrompt = {
  id: string
  level: TrustLevel
  title: string
  rationale?: string
  options: Array<'approve' | 'reject' | 'delay'>
  createdAt: number
  meta?: any
}

class PermissionManager extends EventEmitter {
  private prompts: Map<string, TrustPrompt> = new Map()
  private paused = false
  private waiters: Map<string, Array<(d: 'approve'|'reject'|'delay') => void>> = new Map()

  isPaused() { return this.paused }
  setPaused(p: boolean) {
    this.paused = !!p
    sseBroker.broadcast('trust:kill', { paused: this.paused })
    this.emit('kill', { paused: this.paused })
  }

  createPrompt(data: Omit<TrustPrompt, 'id' | 'createdAt'>): TrustPrompt {
    const id = `tp_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    const prompt: TrustPrompt = { id, level: data.level, title: data.title, rationale: data.rationale, options: data.options?.length ? data.options : ['approve','reject','delay'], createdAt: Date.now(), meta: data.meta }
    this.prompts.set(id, prompt)
    sseBroker.broadcast('trust:prompt', prompt)
    this.emit('prompt', prompt)
    return prompt
  }

  listPending(): TrustPrompt[] {
    return Array.from(this.prompts.values())
  }

  decide(id: string, decision: 'approve' | 'reject' | 'delay', meta?: any): { ok: boolean; prompt?: TrustPrompt } {
    const p = this.prompts.get(id)
    if (!p) return { ok: false }
    this.prompts.delete(id)
    sseBroker.broadcast('trust:decision', { id, decision, meta })
    this.emit('decision', { id, decision, meta })
    const ws = this.waiters.get(id)
    if (ws && ws.length) {
      for (const w of ws) { try { w(decision) } catch {} }
      this.waiters.delete(id)
    }
    return { ok: true, prompt: p }
  }

  waitForDecision(id: string, timeoutMs = 120000): Promise<'approve'|'reject'|'delay'|'timeout'> {
    return new Promise(resolve => {
      const list = this.waiters.get(id) || []
      list.push((d) => resolve(d))
      this.waiters.set(id, list)
      if (timeoutMs > 0) {
        setTimeout(() => {
          if (this.waiters.has(id)) {
            this.waiters.delete(id)
            resolve('timeout')
          }
        }, timeoutMs)
      }
    })
  }
}

export const permissionManager = new PermissionManager()
