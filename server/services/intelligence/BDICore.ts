import { EventEmitter } from 'events'
import { IntentParser } from '../intent/IntentParser'
import { taskOrchestrator } from '../orchestrator/TaskOrchestrator'
import { beliefStore } from './BeliefStore'

export type DesireInput = {
  userText: string
  priority?: number
  userId?: string
  contextTypes?: string[]
  goalOverride?: string
  simulate?: boolean
  sandbox?: { allowedHosts?: string[]; allowProcess?: boolean; allowPowershell?: boolean; allowApp?: boolean; allowUI?: boolean }
}

export type DesireResult = {
  desireId: string
  jobId: string
  goal: string
}

export type BDICoreStatus = {
  orchestrator: ReturnType<typeof taskOrchestrator.getStatus>
  beliefs: ReturnType<typeof beliefStore.snapshot>
  recentDesires: DesireResult[]
}

class BDICore extends EventEmitter {
  private parser = new IntentParser()
  private recent: DesireResult[] = []

  async submitDesire(input: DesireInput): Promise<DesireResult> {
    const text = String(input.userText || '').trim()
    const goalOverride = typeof input.goalOverride === 'string' ? input.goalOverride : undefined
    const { goal, sag } = await this.parser.parse(text, { userId: input.userId, contextTypes: input.contextTypes, goalOverride })
    const job = await taskOrchestrator.enqueue({ plan: sag, priority: input.priority, simulate: input.simulate, sandbox: input.sandbox })
    const out: DesireResult = { desireId: job.id, jobId: job.id, goal }
    this.emit('desire', out)
    try {
      this.recent.push(out)
      if (this.recent.length > 20) this.recent = this.recent.slice(-20)
    } catch {}
    return out
  }

  getStatus(): BDICoreStatus {
    return {
      orchestrator: taskOrchestrator.getStatus(),
      beliefs: beliefStore.snapshot(),
      recentDesires: this.recent.slice(),
    }
  }
}

export const bdiCore = new BDICore()
