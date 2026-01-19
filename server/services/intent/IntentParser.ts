import { EventEmitter } from 'events'
import { compilePlanUniversal, type Plan } from '../planner/HTNPlanner'
import { getTopContext } from '../context/TCG'

export type BDI = {
  beliefs: Record<string, any>
  desires: string[]
  intentions: { plan: Plan }
}

export class IntentParser extends EventEmitter {
  async parse(input: string, opts?: { userId?: string; contextTypes?: string[]; goalOverride?: string }): Promise<{ goal: string; sag: Plan; bdi: BDI }> {
    const goal = (opts?.goalOverride || input || '').trim()
    const beliefs = await this.buildBeliefs(opts)
    const desires = [goal]
    const plan = await compilePlanUniversal(goal, { beliefs })
    const bdi: BDI = { beliefs, desires, intentions: { plan } }
    this.emit('parsed', { goal, plan })
    return { goal, sag: plan, bdi }
  }

  private async buildBeliefs(opts?: { userId?: string; contextTypes?: string[] }): Promise<Record<string, any>> {
    try {
      const top = await getTopContext(20, opts?.contextTypes as any)
      return { userId: opts?.userId || 'demo-user', context: top, auth: { userId: opts?.userId || 'demo-user' } }
    } catch {
      return { userId: opts?.userId || 'demo-user', context: [], auth: { userId: opts?.userId || 'demo-user' } }
    }
  }
}

export const intentParser = new IntentParser()
