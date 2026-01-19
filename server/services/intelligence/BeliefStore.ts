import { EventEmitter } from 'events'
import { messageBus, type MsgEnvelope } from '../bus/MessageBus'
import { getTopContext } from '../context/TCG'
import type { EmotionPercept, SafetyPercept, SystemStatusPercept, UserInputPercept, AppStatePercept } from '../bus/Percepts'

export type BeliefSnapshot = {
  lastUpdated: string | null
  mood: string | null
  safety: SafetyPercept | null
  system: SystemStatusPercept | null
  lastUserInput: UserInputPercept | null
  lastAppContext: AppStatePercept | null
  topContext: any[]
}

class BeliefStore extends EventEmitter {
  private started = false
  private lastUpdated: number | null = null
  private mood: string | null = null
  private safety: SafetyPercept | null = null
  private system: SystemStatusPercept | null = null
  private lastUserInput: UserInputPercept | null = null
  private lastAppContext: AppStatePercept | null = null
  private topContext: any[] = []
  private unsub: Array<() => void> = []
  private ctxTimer: NodeJS.Timeout | null = null

  start() {
    if (this.started) return
    this.started = true

    const sub = (topic: string, fn: (env: MsgEnvelope<any>) => void) => {
      const off = messageBus.subscribe(topic as any, fn)
      this.unsub.push(off)
    }

    sub('PERCEPT:emotion', (env) => {
      const p = env.payload as EmotionPercept
      if (!p) return
      this.mood = p.label || this.mood
      this.touch()
    })

    sub('PERCEPT:safety', (env) => {
      const p = env.payload as SafetyPercept
      if (!p) return
      this.safety = p
      this.touch()
    })

    sub('PERCEPT:system', (env) => {
      const p = env.payload as SystemStatusPercept
      if (!p) return
      this.system = p
      this.touch()
    })

    sub('PERCEPT:user_input', (env) => {
      const p = env.payload as UserInputPercept
      if (!p) return
      this.lastUserInput = p
      this.touch()
    })

    sub('PERCEPT:app_context', (env) => {
      const p = env.payload as AppStatePercept
      if (!p) return
      this.lastAppContext = p
      this.touch()
    })

    this.refreshContext().catch(() => {})
    this.ctxTimer = setInterval(() => { void this.refreshContext().catch(() => {}) }, 30 * 1000)
  }

  stop() {
    if (!this.started) return
    this.started = false
    for (const off of this.unsub.splice(0)) {
      try { off() } catch {}
    }
    if (this.ctxTimer) clearInterval(this.ctxTimer)
    this.ctxTimer = null
  }

  private touch() {
    this.lastUpdated = Date.now()
    this.emit('update', this.snapshot())
  }

  private async refreshContext() {
    try {
      const items = await getTopContext(20)
      this.topContext = items
      this.touch()
    } catch {}
  }

  snapshot(): BeliefSnapshot {
    return {
      lastUpdated: this.lastUpdated ? new Date(this.lastUpdated).toISOString() : null,
      mood: this.mood,
      safety: this.safety,
      system: this.system,
      lastUserInput: this.lastUserInput,
      lastAppContext: this.lastAppContext,
      topContext: this.topContext.slice(),
    }
  }
}

export const beliefStore = new BeliefStore()
