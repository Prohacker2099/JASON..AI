import { ActionDefinition, ExecutionResult } from '../ai/selfLearning/Adapters'
import { daiSandbox } from '../execution/DAI'
import { alignmentModel } from '../ai/selfLearning/Alignment'
import { scrl } from '../intelligence/SCRL'

export type PlanTask = {
  id: string
  name: string
  action?: ActionDefinition
  children?: PlanTask[]
  riskLevel?: number
  tags?: string[]
}

export type Plan = { id: string; goal: string; tasks: PlanTask[] }

function genId(p: string) { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }

export function compilePlan(goal: string, context?: Record<string, any>): Plan {
  const g = (goal || '').toLowerCase()
  const tasks: PlanTask[] = []

  // Minimal HTN-like expansion for a few common intents; default to analyze→plan→act
  if (g.includes('plan') && (g.includes('trip') || g.includes('holiday') || g.includes('vacation'))) {
    const root = genId('plan')
    tasks.push({ id: genId('analyze_prefs'), name: 'Analyze preferences', tags: ['analyze','safe'] })
    tasks.push({ id: genId('check_calendar'), name: 'Check calendar availability', tags: ['calendar','safe'] })
    tasks.push({ id: genId('weather'), name: 'Fetch weather for destination', action: { type: 'http', name: 'fetch_weather', payload: { url: 'https://api.weather.gov', method: 'GET' }, riskLevel: 0.1, tags: ['help','safe'] }, riskLevel: 0.1, tags: ['help','safe'] })
    tasks.push({ id: genId('options'), name: 'Draft itinerary options', tags: ['draft','safe'] })
    // High-impact booking step with CPA-lite fallbacks
    tasks.push({
      id: genId('confirm'),
      name: 'Level 3: Confirm bookings',
      tags: ['financial','confirm'],
      riskLevel: 0.9,
      // children act as CPA-lite fallbacks if confirmation/booking fails or is rejected
      children: [
        { id: genId('alt_price_check'), name: 'Fallback: Check alternate dates/routes', action: { type: 'http', name: 'alt_price_probe', payload: { url: 'https://api.weather.gov', method: 'GET' }, riskLevel: 0.2, tags: ['help','safe','efficient'] }, riskLevel: 0.2, tags: ['help','safe','efficient'] },
        { id: genId('notify_user'), name: 'Fallback: Draft summary + ask for guidance', tags: ['draft','safe'] },
      ]
    })
  } else if (g.includes('thesis') || g.includes('report') || g.includes('draft')) {
    tasks.push({ id: genId('gather_sources'), name: 'Gather sources', tags: ['safe'] })
    tasks.push({ id: genId('outline'), name: 'Create outline', tags: ['safe'] })
    tasks.push({ id: genId('write_draft'), name: 'Write draft', tags: ['safe'] })
    tasks.push({ id: genId('review'), name: 'Self-review and check style', tags: ['safe'] })
    tasks.push({ id: genId('final_confirm'), name: 'Level 3: Confirm final submission', tags: ['confirm'], riskLevel: 0.9, children: [
      { id: genId('fallback_peer_review'), name: 'Fallback: Create peer-review checklist', tags: ['draft','safe'] },
    ] })
  } else {
    tasks.push({ id: genId('analyze'), name: 'Analyze context', tags: ['safe'] })
    tasks.push({ id: genId('plan'), name: 'Draft plan', tags: ['safe'] })
    tasks.push({ id: genId('act'), name: 'Execute low-risk steps', tags: ['safe'], children: [
      { id: genId('fallback_request_confirmation'), name: 'Fallback: Request user confirmation for next step', tags: ['confirm','safe'] }
    ] })
  }

  return { id: genId('plan'), goal, tasks }
}

export async function executePlan(plan: Plan, options?: { simulate?: boolean; sandbox?: { allowedHosts?: string[]; allowProcess?: boolean; allowPowershell?: boolean } }): Promise<{ results: Array<{ taskId: string; ok: boolean; result?: any; error?: string }>; }> {
  const results: Array<{ taskId: string; ok: boolean; result?: any; error?: string }> = []

  async function runTask(t: PlanTask): Promise<void> {
    if (t.action) {
      const res: ExecutionResult = await daiSandbox.execute(t.action, { simulate: options?.simulate ?? true, allowedHosts: options?.sandbox?.allowedHosts, allowProcess: options?.sandbox?.allowProcess, allowPowershell: options?.sandbox?.allowPowershell })
      results.push({ taskId: t.id, ok: res.ok, result: res.result, error: res.error })

      // SCRL: review execution with alignment score
      try {
        const planned = { id: t.id, name: t.name, tags: t.tags, riskLevel: t.riskLevel, action: t.action }
        const alignmentScore = alignmentModel.scoreForAction(t.action as ActionDefinition)
        const actual = { result: res.result, error: res.error, alignmentScore }
        await scrl.reviewExecution(plan.id, t.id, planned, actual, res.ok)
      } catch {}

      // CPA-lite: if failed and has children fallbacks, attempt them
      if (!res.ok && Array.isArray(t.children) && t.children.length > 0) {
        for (const c of t.children) { await runTask(c) }
      }
    } else {
      // Non-executable step: simulate completion
      results.push({ taskId: t.id, ok: true })
      if (Array.isArray(t.children) && t.children.length > 0) {
        for (const c of t.children) { await runTask(c) }
      }
    }
  }

  for (const t of plan.tasks) {
    await runTask(t)
    // If not simulating and last result failed without fallbacks, break early
    const last = results[results.length - 1]
    if (last && !last.ok && !options?.simulate) break
  }
  return { results }
}
