import { messageBus, makeEnvelope, type MsgEnvelope } from './MessageBus'

export type EmotionPercept = {
  label: string
  confidence?: number
  derivedFrom?: string
  valence?: number
  arousal?: number
  trend5m?: 'rising' | 'falling' | 'flat'
}

export type SafetyPercept = {
  riskScore: number
  riskKinds?: string[]
  severity?: 'low' | 'medium' | 'high' | 'critical'
  gatingRequired?: boolean
  recommended?: 'block' | 'challenge' | 'pass' | 'defer'
  explanation?: string
  detector?: string
  matchedRules?: string[]
  requiredLevel?: 1 | 2 | 3
  evidence?: { from?: string; markers?: string[] }
}

export type PolicySubject = { kind: 'command' | 'input' | 'app' | 'action' | 'other'; ref?: string }
export type PolicyDecision = 'allow' | 'deny' | 'allow_with_changes' | 'require_approval' | 'approved' | 'rejected' | 'delayed'
export type PolicyPercept = {
  subject: PolicySubject
  decision: PolicyDecision
  reasons?: string[]
  remediations?: string[]
  level?: 1 | 2 | 3
  approvalId?: string
}

export type SystemStatusPercept = {
  state: 'stable' | 'unstable' | 'degraded' | 'recovering'
  cpu?: number
  mem?: number
  battery?: { level?: number; onAC?: boolean }
  thermals?: { cpuTemp?: number; gpuTemp?: number }
  network?: { up?: boolean; metered?: boolean }
  reason?: string
}

export type UserInputPercept = {
  modality: 'keyboard' | 'mouse' | 'voice' | 'touch' | 'clipboard'
  normalized?: string
  rawHint?: string
  isSystemKey?: boolean
  app?: { name?: string; pid?: number; windowTitle?: string; privilege?: 'user' | 'admin' | 'system'; sandboxed?: boolean; classification?: string }
  intentHint?: string
  sequenceId?: string
}

export type AppStatePercept = {
  event: 'foreground_changed' | 'process_start' | 'process_exit' | 'window_minimize'
  app: { name?: string; pid?: number; windowTitle?: string; path?: string; sandboxed?: boolean; classification?: string }
  focus?: boolean
  fullscreen?: boolean
  category?: 'work' | 'distraction' | 'system' | 'unknown'
  durationMs?: number
}

export function publishEmotion(payload: EmotionPercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'emotion', 'percept_bus', payload, 5, extra))
}

export function publishSafety(payload: SafetyPercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'safety', 'percept_bus', payload, 5, extra))
}

export function publishPolicyEval(payload: PolicyPercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'policy', 'percept_bus', payload, 5, extra))
}

export function publishSystemStatus(payload: SystemStatusPercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'system', 'percept_bus', payload, 5, extra))
}

export function publishUserInput(payload: UserInputPercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'user_input', 'percept_bus', payload, 5, extra))
}

export function publishAppContext(payload: AppStatePercept, extra?: Partial<MsgEnvelope>) {
  messageBus.publish(makeEnvelope('PERCEPT', 'app_context', 'percept_bus', payload, 5, extra))
}
