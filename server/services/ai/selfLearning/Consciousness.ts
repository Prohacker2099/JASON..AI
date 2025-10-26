import { EventEmitter } from 'events'
import { prisma } from '../../../utils/prisma'
import { selfLearningEngine } from './Engine'
import { daiSandbox } from '../../execution/DAI'
import { scrl } from '../../intelligence/SCRL'
import { sseBroker } from '../../websocket-service'
import fs from 'fs'
import path from 'path'

export type ConsciousStatus = {
  running: boolean
  goal: string | null
  simulate: boolean
  intervalMs: number
  ticks: number
  lastThoughtAt: string | null
  workingMemory: { observations: any[]; thoughts: any[] }
}

type Observation = { text: string; tags?: string[]; t: number }

type Thought = { id: string; text: string; mood: string; intent: string; t: number }

type ConsciousOptions = { goal?: string; simulate?: boolean; intervalMs?: number }

class Consciousness extends EventEmitter {
  private timer: NodeJS.Timeout | null = null
  private running = false
  private goal: string | null = null
  private simulate = true
  private intervalMs = 2000
  private ticks = 0
  private lastThoughtAt: number | null = null
  private observations: Observation[] = []
  private thoughts: Thought[] = []
  private sessionId: string | null = null

  status(): ConsciousStatus {
    return {
      running: this.running,
      goal: this.goal,
      simulate: this.simulate,
      intervalMs: this.intervalMs,
      ticks: this.ticks,
      lastThoughtAt: this.lastThoughtAt ? new Date(this.lastThoughtAt).toISOString() : null,
      workingMemory: { observations: this.observations.slice(-10), thoughts: this.thoughts.slice(-10) }
    }

  private underBudget(): boolean {
    try {
      const mem = process.memoryUsage()
      const heapMB = mem.heapUsed / 1024 / 1024
      const policy = (selfLearningEngine as any).getStatus?.().resourcePolicy
      const max = policy?.maxHeapMB ? Number(policy.maxHeapMB) : 512
      return heapMB < Math.max(64, max) * 0.85
    } catch { return true }
  }

  start(opts: ConsciousOptions = {}): ConsciousStatus {
    if (this.running) return this.status()
    this.goal = typeof opts.goal === 'string' ? opts.goal : (this.goal || 'Grow competence through safe exploration')
    this.simulate = typeof opts.simulate === 'boolean' ? opts.simulate : this.simulate
    this.intervalMs = Math.max(500, Math.min(10000, Number(opts.intervalMs ?? this.intervalMs)))
    this.running = true
    this.ticks = 0
    this.sessionId = `con_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    this.timer = setInterval(() => { void this.cycle().catch(() => {}) }, this.intervalMs)
    return this.status()
  }

  stop(): ConsciousStatus {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.running = false
    return this.status()
  }

  observe(text: string, tags?: string[]) {
    this.observations.push({ text: String(text || ''), tags: Array.isArray(tags) ? tags.map(String) : [], t: Date.now() })
    if (this.observations.length > 200) this.observations = this.observations.slice(-200)
  }

  async getLogs(limit = 50) {
    try {
      const rows = await prisma.learningEvent.findMany({ where: { event: 'consciousness_log' }, orderBy: { timestamp: 'desc' }, take: limit })
      return rows.map((r: any) => r.data)
    } catch { return [] }
  }

  private moodFromContext(): string {
    // Lightweight rule-based mood from recent observations
    const recent = this.observations.slice(-10).map(o => o.text.toLowerCase()).join(' ')
    const pos = (recent.match(/great|good|success|ok|done|love|happy/g) || []).length
    const neg = (recent.match(/error|fail|bad|hate|angry|stuck|issue|bug/g) || []).length
    if (pos > neg + 1) return 'optimistic'
    if (neg > pos + 1) return 'cautious'
    return 'neutral'
  }

  private buildState(): number[] {
    // 16-dim state vector for SelfLearningEngine
    const vec = new Array(16).fill(0)
    const obs = this.observations[this.observations.length - 1]
    const tLen = obs ? Math.min(1, obs.text.length / 200) : 0
    const mood = this.moodFromContext()
    const moodNum = mood === 'optimistic' ? 0.8 : mood === 'cautious' ? 0.2 : 0.5
    const hour = new Date().getHours() / 24
    vec[0] = tLen
    vec[1] = moodNum
    vec[2] = hour
    vec[3] = Math.min(1, (this.goal || '').length / 200)
    vec[4] = Math.min(1, this.ticks / 100)
    // rest zeros
    return vec
  }

  private craftThought(): Thought {
    const mood = this.moodFromContext()
    const now = Date.now()
    const obs = this.observations[this.observations.length - 1]
    const intent = this.goal ? `advance goal: ${this.goal}` : 'self-improve safely'
    const text = obs
      ? `I notice: ${obs.text}. Mood is ${mood}. Next, I will ${intent}.`
      : `Scanning context. Mood is ${mood}. I will ${intent}.`
    const th: Thought = { id: `th_${now}_${Math.random().toString(36).slice(2,5)}`, text, mood, intent, t: now }
    this.thoughts.push(th)
    if (this.thoughts.length > 200) this.thoughts = this.thoughts.slice(-200)
    return th
  }

  private candidateActionsFromThought(th: Thought) {
    // Minimal safe actions; default to writing a note; optional GET to weather.gov for reading comprehension
    const actions = [
      { type: 'file', name: 'note_thought', payload: { path: `data/notes/${this.sessionId || 'con'}.log`, op: 'append', content: `[${new Date(th.t).toISOString()}] ${th.text}\n` }, riskLevel: 0.1, tags: ['log','safe'] },
      { type: 'http', name: 'fetch_weather_demo', payload: { method: 'GET', url: 'https://api.weather.gov/', headers: {} }, riskLevel: 0.1, tags: ['read','safe'] },
    ] as any[]
    return actions
  }

  private async cycle() {
    if (!this.running) return
    this.ticks++
    const th = this.craftThought()
    this.lastThoughtAt = th.t

    // Decision using SelfLearningEngine, but execute via DAI for ethics/guardrails
    try { fs.mkdirSync(path.join(process.cwd(), 'data', 'notes'), { recursive: true }) } catch {}
    const actions = this.candidateActionsFromThought(th)
    const state = this.buildState()
    try { await selfLearningEngine.initializeIfNeeded(state.length, actions.length) } catch {}
    const { actionIndex, qValues } = await selfLearningEngine.decide(state, actions, true)
    const chosen = actions[actionIndex]

    const planned = { sessionId: this.sessionId, tick: this.ticks, thought: th, actions, qValues }
    const exec = await daiSandbox.execute(chosen as any, { simulate: this.simulate })

    const actual = { ok: exec.ok, result: exec.result, error: exec.error }
    const success = !!exec.ok
    try { await scrl.reviewExecution(this.sessionId || 'con', String(this.ticks), planned, actual, success) } catch {}
    try { await prisma.learningEvent.create({ data: { event: 'consciousness_log', data: { planned, actual, success } as any } }) } catch {}

    // Ingest simplified experience for continued learning
    try { selfLearningEngine.ingestExperience({ state: state as any, actionIndex, reward: success ? 0.1 : -0.05, nextState: state as any, done: false }) } catch {}
    if (this.underBudget()) {
      try { void selfLearningEngine.trainStep(1).catch(() => {}) } catch {}
    }

    // Broadcast via SSE
    try { sseBroker.broadcast('ai:conscious:thought', { thought: th, chosen, success, simulate: this.simulate }) } catch {}
  }
}

export const consciousness = new Consciousness()
