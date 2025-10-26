import { prisma } from '../../../utils/prisma'
import { selfLearningEngine, SelfLearningEngine } from './Engine'
import { alignmentModel } from './Alignment'

export type DailyScheduleConfig = {
  enabled: boolean
  dailyHour: number
  windowMinutes: number
  microIntervalMinutes: number
  batchSize: number
  maxBatchesPerRun: number
  maxHeapMB?: number
}

const DEFAULT_CFG: DailyScheduleConfig = {
  enabled: true,
  dailyHour: 3,
  windowMinutes: 45,
  microIntervalMinutes: 15,
  batchSize: 256,
  maxBatchesPerRun: 10,
  maxHeapMB: undefined
}

class DailyTrainer {
  private engine: SelfLearningEngine | null = null
  private cfg: DailyScheduleConfig = { ...DEFAULT_CFG }
  private timerDaily: NodeJS.Timeout | null = null
  private timerMicro: NodeJS.Timeout | null = null
  private runningDaily = false
  private lastRunAt: Date | null = null
  private lastIngestTs: Date | null = null

  start(engine: SelfLearningEngine) {
    this.engine = engine
    if (this.timerDaily) clearInterval(this.timerDaily)
    if (this.timerMicro) clearInterval(this.timerMicro)
    this.timerDaily = setInterval(() => { void this.tickDaily() }, 60 * 1000)
    this.timerMicro = setInterval(() => { void this.tickMicro() }, Math.max(1, this.cfg.microIntervalMinutes) * 60 * 1000)
  }

  stop() {
    if (this.timerDaily) clearInterval(this.timerDaily)
    if (this.timerMicro) clearInterval(this.timerMicro)
    this.timerDaily = null
    this.timerMicro = null
  }

  configure(next: Partial<DailyScheduleConfig>) {
    this.cfg = { ...this.cfg, ...(next as DailyScheduleConfig) }
    if (this.timerMicro) {
      clearInterval(this.timerMicro)
      this.timerMicro = setInterval(() => { void this.tickMicro() }, Math.max(1, this.cfg.microIntervalMinutes) * 60 * 1000)
    }
  }

  getStatus() {
    return {
      cfg: this.cfg,
      runningDaily: this.runningDaily,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      lastIngestTs: this.lastIngestTs ? this.lastIngestTs.toISOString() : null
    }
  }

  async runOnce(maxBatches?: number) {
    await this.runIngestAndTrain(maxBatches ?? 3)
  }

  private async tickDaily() {
    if (!this.cfg.enabled || this.runningDaily) return
    const now = new Date()
    const start = new Date(now)
    start.setHours(this.cfg.dailyHour, 0, 0, 0)
    const end = new Date(start.getTime() + this.cfg.windowMinutes * 60 * 1000)
    if (now >= start && now <= end) {
      this.runningDaily = true
      try {
        await this.runIngestAndTrain(this.cfg.maxBatchesPerRun)
        try { await alignmentModel.train(20, 64) } catch {}
        this.lastRunAt = new Date()
      } finally {
        this.runningDaily = false
      }
    }
  }

  private async tickMicro() {
    if (!this.cfg.enabled) return
    if (!this.underBudget()) return
    try { await this.engine?.trainStep(1, 16) } catch {}
  }

  private underBudget(): boolean {
    const mem = process.memoryUsage()
    const heapMB = mem.heapUsed / 1024 / 1024
    const policyMax = (this.engine as any)?.getStatus?.().resourcePolicy?.maxHeapMB
    const max = this.cfg.maxHeapMB || policyMax || 512
    return heapMB < Math.max(64, max) * 0.9
  }

  private async runIngestAndTrain(maxBatches: number) {
    if (!this.engine) return
    let batches = 0
    while (batches < maxBatches) {
      if (!this.underBudget()) break
      const exps = await this.fetchExperiencesBatch(this.cfg.batchSize)
      if (exps.length === 0) break
      for (const e of exps) {
        try {
          this.engine.ingestExperience({ state: e.state, actionIndex: e.actionIndex, reward: e.reward, nextState: e.nextState, done: e.done })
        } catch {}
      }
      try { await this.engine.trainStep(1, Math.min(32, Math.max(8, Math.floor(exps.length / 4)))) } catch {}
      batches++
      await new Promise(r => setTimeout(r, 100))
    }
  }

  private async fetchExperiencesBatch(limit: number): Promise<Array<{ state: number[]; actionIndex: number; reward: number; nextState: number[]; done: boolean }>> {
    const where: any = { event: 'self_experience' }
    if (this.lastIngestTs) where.timestamp = { gt: this.lastIngestTs }
    const rows = await prisma.learningEvent.findMany({ where, orderBy: { timestamp: 'asc' }, take: limit })
    const out: Array<{ state: number[]; actionIndex: number; reward: number; nextState: number[]; done: boolean }> = []
    for (const r of rows as any[]) {
      const d = (r.data || {}) as any
      const st = Array.isArray(d.state) ? d.state.map(Number) : []
      const nx = Array.isArray(d.nextState) ? d.nextState.map(Number) : st
      const a = Number(d.actionIndex || 0)
      const rew = Number(d.reward || 0)
      const done = Boolean(d.done)
      out.push({ state: st, actionIndex: a, reward: rew, nextState: nx, done })
    }
    if (rows.length > 0) this.lastIngestTs = new Date(rows[rows.length - 1].timestamp)
    return out
  }
}

export const dailyTrainer = new DailyTrainer()
