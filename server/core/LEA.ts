import { permissionManager } from '../services/trust/PermissionManager'
import { taskOrchestrator } from '../services/orchestrator/TaskOrchestrator'
import { selfLearningEngine } from '../services/ai/selfLearning/Engine'
import { dailyTrainer } from '../services/ai/selfLearning/DailyTrainer'
import { consciousness } from '../services/ai/selfLearning/Consciousness'
import { beliefStore } from '../services/intelligence/BeliefStore'
import { inputPriorityGuard } from '../services/input/InputPriorityGuard'

export type LEAStatus = {
  killSwitch: boolean
  orchestrator: ReturnType<typeof taskOrchestrator.getStatus>
  selfLearning: any
  consciousness: any
  beliefs: ReturnType<typeof beliefStore.snapshot>
}

class LEAMicrokernel {
  private started = false

  start(): void {
    if (this.started) return
    this.started = true
    try { dailyTrainer.start(selfLearningEngine) } catch {}
    try { (consciousness as any).start({ simulate: true, intervalMs: 5000 }) } catch {}
    try { beliefStore.start() } catch {}
    try { inputPriorityGuard.start() } catch {}
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    try { dailyTrainer.stop() } catch {}
    try { (consciousness as any).stop() } catch {}
    try { beliefStore.stop() } catch {}
    try { inputPriorityGuard.stop() } catch {}
  }

  getKillSwitch(): boolean {
    try { return permissionManager.isPaused() } catch { return false }
  }

  setKillSwitch(active: boolean): void {
    try { permissionManager.setPaused(active) } catch {}
  }

  getStatus(): LEAStatus {
    const orchestrator = taskOrchestrator.getStatus()
    let selfLearning: any = null
    try { selfLearning = (selfLearningEngine as any).getStatus?.() || null } catch {}
    let conscious: any = null
    try { conscious = (consciousness as any).status?.() || null } catch {}
    const beliefs = beliefStore.snapshot()
    return {
      killSwitch: this.getKillSwitch(),
      orchestrator,
      selfLearning,
      consciousness: conscious,
      beliefs,
    }
  }
}

export const leaMicrokernel = new LEAMicrokernel()
