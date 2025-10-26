import { prisma } from '../../../utils/prisma'

// We reuse existing Prisma models: LearningEvent + LearningInsight for notes
// This avoids migrations and keeps storage simple in SQLite

export async function logEvent(event: string, data?: Record<string, any>) {
  try {
    await prisma.learningEvent.create({ data: { event, data: data as any } })
  } catch { /* best-effort */ }
}

export async function logDecision(payload: {
  stateSize: number
  actionSize: number
  actionIndex: number
  qValues: number[]
}) {
  await logEvent('self_decision', payload as any)
}

export async function logAction(payload: {
  actionIndex: number
  action: any
  ok: boolean
  reward: number
  result?: any
}) {
  await logEvent('self_action', payload as any)
}

export async function logWeights(weights: Record<string, number>) {
  await logEvent('self_weights', { weights } as any)
}

export async function logTrainer(status: 'started' | 'stopped', intervalMs?: number) {
  await logEvent('self_trainer', { status, intervalMs } as any)
}
export async function logExperience(payload: {
  state: number[]
  actionIndex: number
  reward: number
  nextState: number[]
  done: boolean
}) {
  await logEvent('self_experience', payload as any)
}

