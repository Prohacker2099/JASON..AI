import { EventEmitter } from 'events'
import { sseBroker } from '../websocket-service'
import { taskOrchestrator } from '../orchestrator/TaskOrchestrator'
import { daiSandbox } from '../execution/DAI'
import { defaultTraits, planLibrary, type Beliefs, type PersonaTraits, type PlanRule, type PlanStep } from './PersonaPlans'
import { messageBus, makeEnvelope } from '../bus/MessageBus'

export class PersonaEngine extends EventEmitter {
  private traits: PersonaTraits = { ...defaultTraits }
  private beliefs: Beliefs = {}

  constructor() {
    super()
    // Auto-ingest PERCEPT messages from the in-process MessageBus
    try {
      messageBus.subscribe('PERCEPT', (env) => { void this.ingestPercept({ type: env.topic, ...(env.payload || {}) }).catch(() => {}) })
    } catch {}
  }

  getTraits() { return { ...this.traits } }
  setTraits(next: Partial<PersonaTraits>) { this.traits = { ...this.traits, ...next } ; return this.getTraits() }

  getBeliefs() { return { ...this.beliefs } }
  setBeliefs(next: Beliefs) { this.beliefs = { ...next } ; return this.getBeliefs() }

  updateBelief(key: string, value: any) { (this.beliefs as any)[key] = value; return this.getBeliefs() }

  async ingestPercept(percept: any) {
    try { sseBroker.broadcast('agent:percept', percept) } catch {}
    const matched = planLibrary.filter((r: PlanRule) => {
      try { return !!r.when(this.beliefs, percept, this.traits) } catch { return false }
    })
    for (const rule of matched) { await this.execute(rule, percept) }
    return { matched: matched.map(r => r.id) }
  }

  private async execute(rule: PlanRule, percept?: any) {
    try { sseBroker.broadcast('agent:intention', { rule: rule.id, intention: rule.intention }) } catch {}
    for (const step of rule.steps) { await this.execStep(step, percept) }
  }

  private async execStep(step: PlanStep, _percept?: any) {
    if (step.kind === 'enqueue_goal') {
      const goal = step.goal
      const priority = Number.isFinite(step.priority as any) ? Number(step.priority) : 5
      const simulate = !!step.simulate
      await taskOrchestrator.enqueue({ goal, priority, simulate })
      return
    }
    if (step.kind === 'dai_note') {
      const path = typeof step.path === 'string' && step.path ? step.path : 'data/notes/persona.log'
      const content = `[${new Date().toISOString()}] ${String(step.content)}\n`
      try {
        messageBus.publish(makeEnvelope('ACTION','act:file','persona_engine', {
          intent: 'persona_note',
          action: { type: 'file', name: 'persona_note', payload: { path, op: 'append', content }, riskLevel: 0.1, tags: ['log','safe'] },
          sandbox: { simulate: false }
        }, 5))
      } catch {
        // fallback direct if bus unavailable
        await daiSandbox.execute({ type: 'file', name: 'persona_note', payload: { path, op: 'append', content }, riskLevel: 0.1, tags: ['log','safe'] }, { simulate: false })
      }
      return
    }
    if (step.kind === 'broadcast') {
      try { sseBroker.broadcast(step.event, step.payload) } catch {}
      return
    }
  }
}

export const personaEngine = new PersonaEngine()
