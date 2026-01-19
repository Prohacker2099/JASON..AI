import os from 'os'
import { publishSystemStatus } from '../bus/Percepts'

class SystemHealth {
  private timer: NodeJS.Timeout | null = null
  start(intervalMs = 5000) {
    if (this.timer) return
    const iv = Math.max(1000, Math.min(60000, Number(intervalMs)))
    this.timer = setInterval(() => {
      try {
        const mem = process.memoryUsage()
        const total = os.totalmem()
        const used = mem.rss
        const memRatio = total > 0 ? used / total : 0
        const state: 'stable' | 'unstable' | 'degraded' = memRatio > 0.9 ? 'unstable' : memRatio > 0.75 ? 'degraded' : 'stable'
        publishSystemStatus({ state, mem: memRatio })
      } catch {}
    }, iv)
  }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null } }
}

export const systemHealth = new SystemHealth()
