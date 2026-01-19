import { messageBus } from '../bus/MessageBus'

class InputPriorityGuard {
  private lastAt: number = 0
  private unsub: null | (() => void) = null

  start() {
    if (this.unsub) return
    const off = messageBus.subscribe('PERCEPT:user_input', () => { this.lastAt = Date.now() })
    this.unsub = off
  }

  stop() {
    if (this.unsub) { try { this.unsub() } catch {} ; this.unsub = null }
  }

  isActive(windowMs = 800): boolean {
    return (Date.now() - (this.lastAt || 0)) < Math.max(100, windowMs)
  }

  status() {
    return { lastInputAt: this.lastAt || null, activeRecent: this.isActive(800) }
  }
}

export const inputPriorityGuard = new InputPriorityGuard()
