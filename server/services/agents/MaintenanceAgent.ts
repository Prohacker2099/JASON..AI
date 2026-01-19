import { EventEmitter } from 'events'
import { taskOrchestrator } from '../orchestrator/TaskOrchestrator'

export type MaintenanceStatus = {
  enabled: boolean
  intervalMs: number
  simulate: boolean
  lastRunAt: number | null
  ticks: number
}

export class MaintenanceAgent extends EventEmitter {
  private timer: NodeJS.Timeout | null = null
  private enabled = false
  private intervalMs = 300000 // 5 min
  private simulate = true
  private lastRunAt: number | null = null
  private ticks = 0

  status(): MaintenanceStatus {
    return { enabled: this.enabled, intervalMs: this.intervalMs, simulate: this.simulate, lastRunAt: this.lastRunAt, ticks: this.ticks }
  }

  start(opts: { intervalMs?: number; simulate?: boolean; goal?: string } = {}): MaintenanceStatus {
    if (this.enabled) return this.status()
    this.enabled = true
    this.intervalMs = Math.max(30000, Math.min(3600000, Number(opts.intervalMs ?? this.intervalMs)))
    this.simulate = typeof opts.simulate === 'boolean' ? opts.simulate : this.simulate
    this.timer = setInterval(() => { void this.tick(opts.goal).catch(() => {}) }, this.intervalMs)
    void this.tick(opts.goal).catch(() => {})
    return this.status()
  }

  stop(): MaintenanceStatus {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.enabled = false
    return this.status()
  }

  async runNow(goal?: string): Promise<MaintenanceStatus> {
    await this.tick(goal)
    return this.status()
  }

  private async tick(goal?: string) {
    this.ticks++
    this.lastRunAt = Date.now()
    const g = String(goal || 'System maintenance: background health check and light cleanup')
    try {
      await taskOrchestrator.enqueue({ goal: g, priority: 1, simulate: this.simulate, sandbox: { allowedHosts: [] } })
      this.emit('scheduled', { goal: g, t: this.lastRunAt })
    } catch (e) {
      this.emit('error', e)
    }
  }
}

export const maintenanceAgent = new MaintenanceAgent()
