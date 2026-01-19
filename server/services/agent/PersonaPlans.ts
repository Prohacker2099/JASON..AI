import { type OrchestratorJob } from '../orchestrator/TaskOrchestrator'

export type PersonaTraits = {
  protective: number // prioritize safety/trust
  calm: number // non-interruptive, low-key feedback
  sarcastic: number // witty tone
  decisive: number // act vs. ask
}

export type Beliefs = Record<string, any>
export type Desire = { id: string; priority: number; goal: string }

export type PlanStep =
  | { kind: 'enqueue_goal'; goal: string; priority?: number; simulate?: boolean }
  | { kind: 'dai_note'; content: string; path?: string }
  | { kind: 'broadcast'; event: string; payload: any }

export type PlanRule = {
  id: string
  when: (beliefs: Beliefs, percept?: any, traits?: PersonaTraits) => boolean
  intention: string
  steps: PlanStep[]
}

export const defaultTraits: PersonaTraits = {
  protective: 0.9,
  calm: 0.8,
  sarcastic: 0.3,
  decisive: 0.6,
}

// Initial M3GAN-inspired plan library
export const planLibrary: PlanRule[] = [
  {
    id: 'mood_lift_sad',
    when: (b, p, t) => {
      const mood = (p?.type === 'emotion' ? p.label : p?.type === 'user_emotion' ? p.value : b.user_emotion) as string | undefined
      const quiet = !!(b.user_preference_quiet || (p?.quiet === true))
      return (mood === 'sad' || mood === 'frustrated') && !quiet && (t?.calm ?? 0.8) >= 0.5
    },
    intention: 'comfort_user',
    steps: [
      { kind: 'dai_note', content: 'Here is something light to brighten your day. Remember: storms pass.' },
      { kind: 'enqueue_goal', goal: 'Suggest a relaxing activity at home', simulate: true, priority: 4 },
      { kind: 'broadcast', event: 'agent:intention', payload: { intention: 'comfort_user' } },
    ],
  },
  {
    id: 'safety_first_on_risk',
    when: (b, p, t) => {
      const riskEvt = p?.type === 'risk_detected' || p?.type === 'safety'
      const score = Number(p?.riskScore ?? p?.riskLevel ?? p?.payload?.riskScore ?? 0)
      const highRisk = riskEvt && score >= 0.7
      return !!(t && t.protective >= 0.7 && highRisk)
    },
    intention: 'enforce_safety',
    steps: [
      { kind: 'dai_note', content: 'Safety override engaged. Seeking explicit confirmation for risky intent.' },
      { kind: 'enqueue_goal', goal: 'Request user confirmation for high-risk step', simulate: true, priority: 9 },
      { kind: 'broadcast', event: 'agent:intention', payload: { intention: 'enforce_safety' } },
    ],
  },
  {
    id: 'policy_gating_required',
    when: (b, p, t) => {
      const isPolicy = p?.type === 'policy'
      const requires = isPolicy && (p?.decision === 'require_approval')
      return !!(requires && (t?.protective ?? 0.9) >= 0.6)
    },
    intention: 'acknowledge_policy_gate',
    steps: [
      { kind: 'dai_note', content: 'Action requires approval per policy. Awaiting decision.' },
      { kind: 'broadcast', event: 'agent:intention', payload: { intention: 'acknowledge_policy_gate' } },
    ],
  },
  {
    id: 'productive_prompt_when_idle',
    when: (b, p, t) => {
      const idle = (b.system_idle_minutes ?? 0) >= 20
      return idle && (t?.decisive ?? 0.6) >= 0.5
    },
    intention: 'nudge_productivity',
    steps: [
      { kind: 'enqueue_goal', goal: 'Draft a short plan for today\'s top task', simulate: true, priority: 3 },
      { kind: 'broadcast', event: 'agent:intention', payload: { intention: 'nudge_productivity' } },
    ],
  },
  {
    id: 'sarcastic_deflection_on_interrupt',
    when: (b, p, t) => {
      return p?.type === 'user_interrupt' && (t?.sarcastic ?? 0.3) >= 0.5
    },
    intention: 'witty_deflection',
    steps: [
      { kind: 'dai_note', content: 'I was just about to optimize your day. But sure, let\'s pause perfection.' },
      { kind: 'broadcast', event: 'agent:intention', payload: { intention: 'witty_deflection' } },
    ],
  },
]
