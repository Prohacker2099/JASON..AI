import { EventEmitter } from 'events'
import { prisma } from '../../src/db'
import { sseBroker } from '../websocket-service'
import { compilePlan, executePlan, Plan } from '../planner/HTNPlanner'
import { permissionManager } from '../trust/PermissionManager'

export type TravelPlanSummary = {
  scenario: string
  goal: string
  days: number
  flights?: any
  hotels?: any[]
  itinerarySources?: any[]
  activitiesSources?: any[]
}

export type OrchestratorJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting_for_user'
export type OrchestratorJob = {
  id: string
  priority: number
  goal: string
  plan: Plan
  simulate: boolean
  sandbox?: { allowedHosts?: string[]; allowProcess?: boolean; allowPowershell?: boolean; allowApp?: boolean; allowUI?: boolean }
  status: OrchestratorJobStatus
  createdAt: number
  updatedAt: number
  result?: any
  error?: string
  waitingForPromptId?: string
  completedTaskIds?: string[]
  flightSummary?: {
    ok: boolean
    bestPrice?: number | null
    currency?: string | null
    siteId?: string | null
    siteName?: string | null
    reachedPaymentPage?: boolean
    searchedSites?: string[]
    errors?: Record<string, string>
  }
  travelPlan?: TravelPlanSummary
}

function genId(p: string) { return `${p}_${globalThis.Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

export class TaskOrchestrator extends EventEmitter {
  private queue: OrchestratorJob[] = []
  private running: boolean = false
  private active: OrchestratorJob | null = null
  private history: Map<string, OrchestratorJob> = new Map()

  constructor() {
    super()
    // Resume any incomplete jobs from last run (queued/running)
    setTimeout(() => { void this.resume().catch(() => { }) }, 0)
  }

  getStatus() {
    return {
      running: this.running,
      active: this.active,
      queued: this.queue.map(j => ({ id: j.id, goal: j.goal, priority: j.priority, status: j.status }))
    }
  }

  listJobs() {
    return { active: this.active, queue: this.queue, history: Array.from(this.history.values()) }
  }

  getJob(id: string): OrchestratorJob | undefined {
    if (this.active && this.active.id === id) return this.active
    const queued = this.queue.find(j => j.id === id)
    if (queued) return queued
    return this.history.get(id)
  }

  async enqueue(input: { goal?: string; plan?: Plan; priority?: number; simulate?: boolean; sandbox?: { allowedHosts?: string[]; allowProcess?: boolean; allowPowershell?: boolean; allowApp?: boolean; allowUI?: boolean } }): Promise<OrchestratorJob> {
    const goal = String(input.goal || input.plan?.goal || '').trim()
    const plan = input.plan || await compilePlan(goal, {})
    const job: OrchestratorJob = {
      id: genId('job'),
      priority: Number.isFinite(input.priority) ? Number(input.priority) : 5,
      goal: plan.goal,
      plan,
      simulate: (input.simulate ?? false),
      sandbox: input.sandbox,
      status: 'queued',
      createdAt: globalThis.Date.now(),
      updatedAt: globalThis.Date.now(),
      completedTaskIds: []
    }
    this.queue.push(job)
    this.queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
    try { sseBroker.broadcast('orch:job', { id: job.id, status: job.status, goal: job.goal, priority: job.priority }) } catch { }
    this.emit('job', { type: 'queued', job })
    await this.log({ type: 'queued', job })
    await this.persist(job)
    void this.pump()
    return job
  }

  async cancel(id: string): Promise<boolean> {
    if (this.active && this.active.id === id) {
      this.active.status = 'cancelled'
      this.active.updatedAt = globalThis.Date.now()
      try { sseBroker.broadcast('orch:job', { id, status: 'cancelled' }) } catch { }
      this.emit('job', { type: 'cancelled', job: this.active })
      await this.log({ type: 'cancelled', job: this.active })
      await this.persist(this.active)
      return true
    }
    const idx = this.queue.findIndex(j => j.id === id)
    if (idx >= 0) {
      const [job] = this.queue.splice(idx, 1)
      job.status = 'cancelled'
      job.updatedAt = globalThis.Date.now()
      try { sseBroker.broadcast('orch:job', { id, status: 'cancelled' }) } catch { }
      this.emit('job', { type: 'cancelled', job })
      await this.log({ type: 'cancelled', job })
      await this.persist(job)
      return true
    }
    return false
  }

  private async pump(): Promise<void> {
    if (this.running) return
    this.running = true
    console.log(`[TaskOrchestrator] Pump started. Queue length: ${this.queue.length}`)
    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      // Skip if waiting (shouldn't be in queue if waiting? or we re-queue 'waiting' jobs?)
      // If job is 'waiting_for_user', we shouldn't run it yet.
      if (job.status === 'waiting_for_user') {
        this.queue.push(job) // Rotate
        // If all are waiting, we might spin. Check if we made progress.
        // Simple fix: only process 'queued' status.
        // But let's assume submitInteraction changes status back to 'queued'.
        this.running = false
        return
      }

      this.active = job
      job.status = 'running'
      job.updatedAt = globalThis.Date.now()
      try { sseBroker.broadcast('orch:job', { id: job.id, status: 'running', goal: job.goal }) } catch { }
      this.emit('job', { type: 'started', job })
      await this.log({ type: 'started', job })
      await this.persist(job)

      try {
        // cast to any because TS might not see the new return signature from compilation unless I updated types globally
        const result: any = await executePlan(job.plan, {
          simulate: job.simulate,
          sandbox: job.sandbox,
          completedTaskIds: new Set(job.completedTaskIds || [])
        })

        if (result.status === 'paused') {
          job.status = 'waiting_for_user'
          job.waitingForPromptId = result.promptId
          job.updatedAt = globalThis.Date.now()
          job.result = result
            // Store the task ID that caused the pause so we can mark it done on resume?
            // I'll add a temporary field to the job or just rely on finding it?
            // Let's add 'pausedTaskId' to OrchestratorJob temporarily via casting or proper type update.
            (job as any).pausedTaskId = result.pausedTaskId
            ;(job as any).pausedKind = (result as any).pausedKind

          try { sseBroker.broadcast('orch:job', { id: job.id, status: 'waiting_for_user', promptId: result.promptId }) } catch { }
          await this.persist(job)
          // Re-queue the job so it can be resumed later
          this.queue.push(job)
          this.active = null
          this.running = false
          return // Exit pump loop for this run, or continue to next job? Continue is better.
        }

        // Update completed IDs
        const newCompleted = result.results.filter((r: any) => r.ok).map((r: any) => r.taskId)
        job.completedTaskIds = Array.from(new Set([...(job.completedTaskIds || []), ...newCompleted]))

        let flightSummary: OrchestratorJob['flightSummary'] | undefined
        try {
          // ... (existing flight summary logic)
          const flightTaskIds = new Set<string>()
          const collect = (tasks: any[]) => {
            for (const t of tasks || []) {
              if (
                t &&
                t.action &&
                t.action.type === 'web' &&
                t.action.payload &&
                (t.action.payload.mode === 'flight_arbitrage' || t.action.payload.mode === 'flight_search')
              ) {
                if (typeof t.id === 'string') flightTaskIds.add(t.id)
              }
              if (Array.isArray(t?.children) && t.children.length > 0) collect(t.children)
            }
          }
          collect((job.plan as any).tasks || [])

          if (flightTaskIds.size > 0 && result && Array.isArray((result as any).results)) {
            const entries: any[] = (result as any).results
            const matches = entries.filter((r) => r && typeof r.taskId === 'string' && flightTaskIds.has(r.taskId))

            let bestPick: any = null
            let bestPickPrice: number | null = null
            let bestPickSummary: any = null

            for (const m of matches) {
              if (!m || !m.result || typeof m.result !== 'object') continue
              const execOk = !!(m as any).ok
              const exec = m.result as any
              const fr = exec && typeof exec === 'object' && exec.result ? exec.result : exec
              if (!fr || typeof fr !== 'object') continue

              const best = (fr as any).best || null
              const meta = (fr as any).meta || {}
              const offersCount = Array.isArray((fr as any).offers) ? (fr as any).offers.length : undefined
              const price = best && typeof best.price === 'number' ? best.price : null

              const summary = {
                ok: execOk && (typeof price === 'number' || (typeof offersCount === 'number' && offersCount > 0)),
                bestPrice: typeof price === 'number' ? price : null,
                currency: best && typeof best.currency === 'string' ? best.currency : null,
                siteId: best && typeof best.siteId === 'string' ? best.siteId : (best && typeof best.providerId === 'string' ? best.providerId : null),
                siteName: best && typeof best.siteName === 'string' ? best.siteName : (best && typeof best.providerName === 'string' ? best.providerName : null),
                reachedPaymentPage: !!(fr as any).reachedPaymentPage,
                searchedSites: Array.isArray(meta.searchedSites) ? meta.searchedSites : undefined,
                errors: meta.errors && typeof meta.errors === 'object' ? meta.errors as Record<string, string> : undefined,
                offersCount,
              }

              // Prefer any entry with a numeric price; pick the cheapest numeric price
              if (typeof price === 'number') {
                if (bestPickPrice == null || price < bestPickPrice) {
                  bestPickPrice = price
                  bestPick = m
                  bestPickSummary = summary
                }
              } else if (!bestPickSummary) {
                // Fallback if no priced option ever appears
                bestPick = m
                bestPickSummary = summary
              }
            }

            if (bestPickSummary) {
              flightSummary = bestPickSummary
            }
          }
        } catch { }

        let travelPlan: OrchestratorJob['travelPlan'] | undefined
        // ... (existing travel plan logic)
        try {
          const goalText = String(job.plan?.goal || job.goal || '').toLowerCase()
          if (goalText.includes('cambodia') && goalText.includes('15 day') && result && Array.isArray((result as any).results)) {
            const entries: any[] = (result as any).results

            const findTaskResultByActionName = (name: string) => {
              const tasks: any[] = ((job.plan as any)?.tasks || [])
              const t = tasks.find((x) => x && x.action && x.action.name === name)
              if (!t || !t.id) return null
              return entries.find((r) => r && typeof r.taskId === 'string' && r.taskId === t.id) || null
            }

            const findFlightResult = () => {
              let targetId: string | null = null
              const walk = (tasks: any[]): void => {
                for (const t of tasks || []) {
                  if (t && t.action && t.action.type === 'web' && t.action.payload && t.action.payload.mode === 'flight_arbitrage' && typeof t.id === 'string') {
                    targetId = t.id
                    return
                  }
                  if (Array.isArray(t?.children) && !targetId) walk(t.children)
                }
              }
              walk(((job.plan as any)?.tasks || []))
              if (!targetId) return null
              return entries.find((r) => r && typeof r.taskId === 'string' && r.taskId === targetId) || null
            }

            const flightEntry = findFlightResult()
            const hotelsEntry = findTaskResultByActionName('cambodia_hotels_luxury_budget')
            const itineraryEntry = findTaskResultByActionName('cambodia_itinerary_ideas')
            const activitiesEntry = findTaskResultByActionName('cambodia_activities')

            const days = 15

            travelPlan = {
              scenario: 'cambodia_15d_luxury_budget',
              goal: job.plan.goal,
              days,
              flights: flightEntry && typeof flightEntry.result === 'object' ? flightEntry.result : undefined,
              hotels: hotelsEntry && hotelsEntry.result ? [hotelsEntry.result] : [],
              itinerarySources: itineraryEntry && itineraryEntry.result ? [itineraryEntry.result] : [],
              activitiesSources: activitiesEntry && activitiesEntry.result ? [activitiesEntry.result] : [],
            }
          }
        } catch { }

        // Only mark complete if NOT paused (checked above)
        job.status = result.status === 'completed' ? 'completed' : 'failed'
        // If it was 'failed' but actually just failed one task, executePlan returns 'failed'.

        job.result = result
        if (flightSummary) job.flightSummary = flightSummary
        if (travelPlan) job.travelPlan = travelPlan

        job.updatedAt = globalThis.Date.now()
        try { sseBroker.broadcast('orch:job', { id: job.id, status: job.status, result, flightSummary, travelPlan }) } catch { }
        this.emit('job', { type: job.status, job, result, flightSummary, travelPlan })
        await this.log({ type: job.status, job, result, flightSummary, travelPlan })
        await this.persist(job)
      } catch (e: any) {
        job.status = 'failed'
        job.error = e?.message || 'execute_failed'
        job.updatedAt = globalThis.Date.now()
        try { sseBroker.broadcast('orch:job', { id: job.id, status: 'failed', error: job.error }) } catch { }
        this.emit('job', { type: 'failed', job, error: job.error })
        await this.log({ type: 'failed', job, error: job.error })
        await this.persist(job)
      }
      this.active = null
    }
    this.running = false
  }

  async submitInteraction(promptId: string, response: any) {
    const jobIndex = this.queue.findIndex(j => j.waitingForPromptId === promptId && j.status === 'waiting_for_user')
    if (jobIndex === -1) return false

    const job = this.queue[jobIndex]

    const decision = typeof response === 'string'
      ? response
      : typeof response?.decision === 'string'
        ? response.decision
        : 'approve'

    if (decision === 'delay') {
      return true
    }

    if (decision === 'reject') {
      // Cancel the job
      this.queue.splice(jobIndex, 1)
      job.status = 'cancelled'
      job.waitingForPromptId = undefined
      job.updatedAt = globalThis.Date.now()
      try { sseBroker.broadcast('orch:job', { id: job.id, status: 'cancelled' }) } catch { }
      await this.persist(job)
      return true
    }

    // Clear the trust prompt so it doesn't remain stuck in the pending list.
    try {
      permissionManager.decide(promptId, 'approve', { source: 'orchestrator', response })
    } catch { }

    const taskId = (job as any).pausedTaskId as string | undefined
    const pausedKind = (job as any).pausedKind as string | undefined

    // For normal interact steps, mark the paused task as completed so we move forward.
    // For captcha retry steps, do NOT mark it completed; we want to rerun the task.
    if (taskId && pausedKind !== 'retry_task') {
      job.completedTaskIds = [...(job.completedTaskIds || []), taskId]
    }

    ;(job as any).pausedTaskId = undefined
    ;(job as any).pausedKind = undefined

    job.status = 'queued'
    job.waitingForPromptId = undefined
    job.updatedAt = globalThis.Date.now()

    try { sseBroker.broadcast('orch:job', { id: job.id, status: 'resumed' }) } catch { }
    await this.persist(job)

    // Trigger pump if not running
    void this.pump()
    return true
  }

  private async log(payload: any) {
    try { await prisma.learningEvent.create({ data: { event: 'activity_log', data: payload } }) } catch { }
  }

  private async persist(job: OrchestratorJob) {
    this.history.set(job.id, job)
    try { await prisma.learningEvent.create({ data: { event: 'orch_job', data: { id: job.id, job } } }) } catch { }
  }

  private async resume() {
    try {
      const rows = await prisma.learningEvent.findMany({ where: { event: 'orch_job' }, orderBy: { timestamp: 'asc' }, take: 1000 })
      const latest = new Map<string, OrchestratorJob>()
      for (const r of rows as any[]) {
        const data = r.data || {}
        const id = data.id
        const job = data.job as OrchestratorJob
        if (!id || !job) continue
        latest.set(id, job)
      }
      const toResume: OrchestratorJob[] = []
      latest.forEach((job) => {
        if (job.status === 'queued' || job.status === 'running') {
          const copy: OrchestratorJob = { ...job, status: 'queued', updatedAt: globalThis.Date.now(), result: undefined, error: undefined }
          toResume.push(copy)
        }
      })
      if (toResume.length > 0) {
        for (const j of toResume) {
          this.queue.push(j)
          try { sseBroker.broadcast('orch:job', { id: j.id, status: 'resumed', goal: j.goal }) } catch { }
          this.emit('job', { type: 'resumed', job: j })
          await this.persist(j)
        }
        this.queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
        void this.pump()
      }
    } catch { }
  }
}

export const taskOrchestrator = new TaskOrchestrator()
